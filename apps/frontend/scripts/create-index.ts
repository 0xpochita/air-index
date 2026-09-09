import assert from "node:assert/strict";
import { encodeFunctionData, parseEventLogs, sha256, toHex } from "viem";
import { permissionedRegistryAbi } from "../src/lib/ens/abis/PermissionedRegistry";
import { permissionedResolverAbi } from "../src/lib/ens/abis/PermissionedResolver";
import { verifiableFactoryAbi } from "../src/lib/ens/abis/VerifiableFactory";
import { ensClient } from "../src/lib/ens/client";
import { ENS_DEPLOYMENT } from "../src/lib/ens/deployments";
import { toDnsEncoded, toNode } from "../src/lib/ens/name";
import {
  METHODOLOGY_LOCK_BITMAP,
  REGISTRY_ROLE,
  RESOLVER_ROLE,
} from "../src/lib/ens/roles";
import { getIndexBySlug } from "../src/lib/mock/indexes";
import { getWallet, logTx, requireFunds } from "./lib/wallet";

const SLUG = process.argv[2] ?? "defi-blue";
const ONE_YEAR_SECONDS = 31_536_000n;
const WEIGHT_KEY = "weight";
const CONSTITUENTS_KEY = "constituents";
const IPFS_DAG_PB_SHA256_PREFIX = "e30101701220";
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000" as const;

const withAdmin = (role: bigint) => role | (role << 128n);

/**
 * Contenthash, clear and upgrade are granted so step 5 can burn all three. The
 * record setters stay so a rebalancer can still update weights afterwards.
 */
const INDEX_RESOLVER_ROLES =
  withAdmin(RESOLVER_ROLE.SET_ADDR) |
  withAdmin(RESOLVER_ROLE.SET_TEXT) |
  withAdmin(RESOLVER_ROLE.SET_DATA) |
  withAdmin(RESOLVER_ROLE.SET_CONTENTHASH) |
  withAdmin(RESOLVER_ROLE.CLEAR) |
  withAdmin(RESOLVER_ROLE.UPGRADE);

/** The index itself is transferable, so CAN_TRANSFER_ADMIN is granted at registration. */
const INDEX_ROLES =
  withAdmin(REGISTRY_ROLE.SET_RESOLVER) |
  withAdmin(REGISTRY_ROLE.SET_SUBREGISTRY) |
  REGISTRY_ROLE.CAN_TRANSFER_ADMIN;

const requireEnvAddress = (key: string): `0x${string}` => {
  const value = process.env[key];
  assert.ok(value, `${key} is missing. Run pnpm bootstrap first.`);
  return value as `0x${string}`;
};

/** Structurally valid ipfs contenthash over the published methodology document. */
const toContenthash = (document: string): `0x${string}` =>
  `0x${IPFS_DAG_PB_SHA256_PREFIX}${sha256(toHex(document)).slice(2)}`;

const run = async () => {
  const index = getIndexBySlug(SLUG);
  assert.ok(index, `no index named ${SLUG} in the mock catalogue`);

  const { account, client } = getWallet();
  const registry = requireEnvAddress("NEXT_PUBLIC_AIR_INDEX_REGISTRY");

  console.log(`deployer ${account.address}`);
  await requireFunds(account.address);
  console.log(`\ncreating ${index.ensName}`);
  console.log(
    `  ${index.constituents.length} constituents, registry ${registry}`,
  );

  console.log("\n1. deploy a resolver for this index alone");
  const deployReceipt = await logTx(
    "deployProxy",
    await client.writeContract({
      address: ENS_DEPLOYMENT.verifiableFactory,
      abi: verifiableFactoryAbi,
      functionName: "deployProxy",
      args: [
        ENS_DEPLOYMENT.permissionedResolverImpl,
        BigInt(Date.now()),
        encodeFunctionData({
          abi: permissionedResolverAbi,
          functionName: "initialize",
          args: [account.address, INDEX_RESOLVER_ROLES, []],
        }),
      ],
    }),
  );
  const [proxyEvent] = parseEventLogs({
    abi: verifiableFactoryAbi,
    eventName: "ProxyDeployed",
    logs: deployReceipt.logs,
  });
  assert.ok(proxyEvent, "ProxyDeployed must be emitted");
  const indexResolver = proxyEvent.args.proxyAddress as `0x${string}`;
  console.log(`  resolver ${indexResolver}`);

  console.log(`\n2. register ${SLUG} in the air index registry`);
  const expiry = BigInt(Math.floor(Date.now() / 1000)) + ONE_YEAR_SECONDS;
  await logTx(
    "register",
    await client.writeContract({
      address: registry,
      abi: permissionedRegistryAbi,
      functionName: "register",
      args: [
        SLUG,
        account.address,
        ZERO_ADDRESS,
        indexResolver,
        INDEX_ROLES,
        expiry,
      ],
    }),
  );

  console.log("\n3. publish the whole composition in one transaction");
  const methodology = JSON.stringify({
    name: index.name,
    description: index.description,
    constituents: index.constituents.map((entry) => ({
      symbol: entry.token.symbol,
      weightBps: entry.weightBps,
    })),
  });
  const contenthash = toContenthash(methodology);
  const labels = index.constituents.map((entry) => entry.token.symbol);

  const calls = [
    ...index.constituents.flatMap((entry) => {
      const node = toNode(`${entry.token.symbol}.${index.ensName}`);
      return [
        encodeFunctionData({
          abi: permissionedResolverAbi,
          functionName: "setAddr",
          args: [node, entry.token.address],
        }),
        encodeFunctionData({
          abi: permissionedResolverAbi,
          functionName: "setText",
          args: [node, WEIGHT_KEY, String(entry.weightBps)],
        }),
      ];
    }),
    encodeFunctionData({
      abi: permissionedResolverAbi,
      functionName: "setText",
      args: [toNode(index.ensName), CONSTITUENTS_KEY, labels.join(",")],
    }),
    encodeFunctionData({
      abi: permissionedResolverAbi,
      functionName: "setText",
      args: [toNode(index.ensName), "description", index.description],
    }),
    encodeFunctionData({
      abi: permissionedResolverAbi,
      functionName: "setContenthash",
      args: [toNode(index.ensName), contenthash],
    }),
  ];

  console.log(`  ${calls.length} record writes batched`);
  await logTx(
    "multicall",
    await client.writeContract({
      address: indexResolver,
      abi: permissionedResolverAbi,
      functionName: "multicall",
      args: [calls],
    }),
  );

  if (index.rebalancer) {
    console.log(`\n4. delegate the ${WEIGHT_KEY} key to the rebalancer only`);
    for (const entry of index.constituents) {
      await logTx(
        `authorize ${entry.token.symbol}`,
        await client.writeContract({
          address: indexResolver,
          abi: permissionedResolverAbi,
          functionName: "authorizeTextRoles",
          args: [
            toDnsEncoded(`${entry.token.symbol}.${index.ensName}`),
            WEIGHT_KEY,
            index.rebalancer.address,
            true,
          ],
        }),
      );
    }
    console.log(
      `  agent ${index.rebalancer.address} can set only "${WEIGHT_KEY}"`,
    );
  }

  console.log("\n5. lock the methodology permanently");
  await logTx(
    "revokeRootRoles",
    await client.writeContract({
      address: indexResolver,
      abi: permissionedResolverAbi,
      functionName: "revokeRootRoles",
      args: [METHODOLOGY_LOCK_BITMAP, account.address],
    }),
  );

  console.log("\n6. read it all back with stock viem");
  const published = await ensClient.getEnsText({
    name: index.ensName,
    key: CONSTITUENTS_KEY,
  });
  console.log(`  constituents = ${published}`);
  assert.equal(
    published,
    labels.join(","),
    "the constituent list must resolve",
  );

  for (const symbol of labels) {
    const name = `${symbol}.${index.ensName}`;
    const [addr, weight] = await Promise.all([
      ensClient.getEnsAddress({ name }),
      ensClient.getEnsText({ name, key: WEIGHT_KEY }),
    ]);
    console.log(`  ${name.padEnd(34)} ${addr} ${weight}`);
    assert.ok(addr, `${name} must resolve an address`);
  }

  console.log(`\n${index.ensName} is live`);
  console.log(`  resolver ${indexResolver}`);
  console.log(`  methodology ${contenthash}`);
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
