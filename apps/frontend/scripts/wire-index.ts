import assert from "node:assert/strict";
import { encodeFunctionData, parseUnits } from "viem";
import { permissionedRegistryAbi } from "../src/lib/ens/abis/PermissionedRegistry";
import { permissionedResolverAbi } from "../src/lib/ens/abis/PermissionedResolver";
import { ensClient } from "../src/lib/ens/client";
import { PROTOCOL_ROOT } from "../src/lib/ens/deployments";
import { toNode } from "../src/lib/ens/name";
import { readConstituentLabels } from "../src/lib/ens/read";
import {
  getUnitPriceUsd,
  INCEPTION_UNIT_PRICE_USD,
} from "../src/lib/index-math";
import { getIndexBySlug } from "../src/lib/mock/indexes";
import { SETTLEMENT_SYMBOL } from "../src/lib/mock/quotes";
import { findToken, isDeployed, TOKENS } from "../src/lib/mock/tokens";
import { readArtifact } from "./lib/artifacts";
import { loadEnv } from "./lib/env";
import { getWallet, logTx, publicClient, requireFunds } from "./lib/wallet";

loadEnv();

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000" as const;
const SLUG = process.argv[2];

/**
 * Points a published index at real Sepolia contracts.
 *
 * Two writes, both onto records the methodology lock deliberately left open:
 *   addr(60) on `<slug>.airindex.eth`        → the share token for this index
 *   addr(60) on `<symbol>.<slug>.airindex.eth` → the constituent's mock ERC20
 *
 * Which means the ENS name is the only thing a client needs. Resolve the name,
 * get the vault; resolve a subname, get the token. Nothing is configured in the
 * frontend.
 */
const run = async () => {
  assert.ok(SLUG, "usage: pnpm wire-index <slug>");

  const registry = process.env.NEXT_PUBLIC_AIR_INDEX_REGISTRY as `0x${string}`;
  assert.ok(registry, "NEXT_PUBLIC_AIR_INDEX_REGISTRY is missing");

  const ensName = `${SLUG}.${PROTOCOL_ROOT}`;
  const { account, client } = getWallet();
  await requireFunds(account.address);

  const quote = TOKENS[SETTLEMENT_SYMBOL];
  assert.ok(
    isDeployed(quote),
    `${SETTLEMENT_SYMBOL} is not deployed. Run pnpm deploy-tokens first.`,
  );

  const resolver = await publicClient.readContract({
    address: registry,
    abi: permissionedRegistryAbi,
    functionName: "getResolver",
    args: [SLUG],
  });
  assert.notEqual(resolver, ZERO_ADDRESS, `${ensName} is not registered`);

  const labels = await readConstituentLabels(ensName);
  assert.ok(labels.length > 0, `${ensName} publishes no constituent list`);

  console.log(`index    ${ensName}`);
  console.log(`resolver ${resolver}`);
  console.log(
    `quote    ${quote.address} (m${SETTLEMENT_SYMBOL.toUpperCase()})`,
  );

  console.log("\n1. share token");
  const existingVault = await ensClient.getEnsAddress({ name: ensName });
  const existingCode = existingVault
    ? await publicClient.getCode({ address: existingVault })
    : undefined;

  let vault = existingVault;

  if (vault && existingCode && existingCode !== "0x") {
    console.log(`  ${vault} (already deployed)`);
  } else {
    const fund = getIndexBySlug(SLUG);
    const unitPriceUsd = fund
      ? getUnitPriceUsd(fund)
      : INCEPTION_UNIT_PRICE_USD;
    const sharePrice = parseUnits(unitPriceUsd.toFixed(6), quote.decimals);
    const shareSymbol = (fund?.ticker ?? SLUG).toUpperCase().slice(0, 11);

    const { abi, bytecode } = readArtifact("IndexVault");
    const hash = await client.deployContract({
      abi,
      bytecode,
      args: [
        `${fund?.name ?? SLUG} Index`,
        shareSymbol,
        ensName,
        quote.address,
        sharePrice,
      ],
    });
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    assert.equal(receipt.status, "success", "vault deploy reverted");
    assert.ok(receipt.contractAddress, "vault produced no address");

    vault = receipt.contractAddress;
    console.log(
      `  ${vault} ${shareSymbol} at ${unitPriceUsd.toFixed(2)} m${SETTLEMENT_SYMBOL.toUpperCase()} per share (gas ${receipt.gasUsed})`,
    );
  }

  console.log("\n2. publish the addresses onto the ENS records");
  const constituentCalls = labels.flatMap((symbol) => {
    const token = findToken(symbol);

    if (!token || !isDeployed(token)) {
      console.log(`  ${symbol.padEnd(6)} skipped, no Sepolia deployment`);
      return [];
    }

    return [
      encodeFunctionData({
        abi: permissionedResolverAbi,
        functionName: "setAddr",
        args: [toNode(`${symbol}.${ensName}`), token.address],
      }),
    ];
  });

  const calls = [
    encodeFunctionData({
      abi: permissionedResolverAbi,
      functionName: "setAddr",
      args: [toNode(ensName), vault as `0x${string}`],
    }),
    ...constituentCalls,
  ];

  console.log(`  ${calls.length} addr records batched`);
  await logTx(
    "multicall",
    await client.writeContract({
      address: resolver,
      abi: permissionedResolverAbi,
      functionName: "multicall",
      args: [calls],
    }),
  );

  console.log("\n3. read it all back through the universal resolver");
  const published = await ensClient.getEnsAddress({ name: ensName });
  console.log(`  ${ensName.padEnd(34)} ${published}`);
  assert.equal(
    published?.toLowerCase(),
    vault?.toLowerCase(),
    "the index name must resolve to its share token",
  );

  for (const symbol of labels) {
    const token = findToken(symbol);
    const name = `${symbol}.${ensName}`;
    const resolved = await ensClient.getEnsAddress({ name });
    console.log(`  ${name.padEnd(34)} ${resolved ?? "native"}`);

    if (token && isDeployed(token)) {
      assert.equal(
        resolved?.toLowerCase(),
        token.address.toLowerCase(),
        `${name} must resolve to its mock ERC20`,
      );
      const code = await publicClient.getCode({ address: token.address });
      assert.ok(code && code !== "0x", `${name} resolves to an empty address`);
    }
  }

  console.log(`\n${ensName} settles in ${vault}`);
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
