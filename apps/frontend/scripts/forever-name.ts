import assert from "node:assert/strict";
import { encodeFunctionData, parseEventLogs } from "viem";
import { permissionedRegistryAbi } from "../src/lib/ens/abis/PermissionedRegistry";
import { permissionedResolverAbi } from "../src/lib/ens/abis/PermissionedResolver";
import { userRegistryAbi } from "../src/lib/ens/abis/UserRegistry";
import { verifiableFactoryAbi } from "../src/lib/ens/abis/VerifiableFactory";
import { ensClient } from "../src/lib/ens/client";
import { ENS_DEPLOYMENT, PROTOCOL_ROOT } from "../src/lib/ens/deployments";
import { toNode } from "../src/lib/ens/name";
import { readConstituentLabels } from "../src/lib/ens/read";
import { REGISTRY_ROLE } from "../src/lib/ens/roles";
import { loadEnv } from "./lib/env";
import { getWallet, logTx, publicClient, requireFunds } from "./lib/wallet";

loadEnv();

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000" as const;
const MAX_UINT64 = (1n << 64n) - 1n;
const SLUG = process.argv[2];
const LABEL = process.argv[3] ?? "charter";
const CHARTER_KEY = "charter";
const CHARTER =
  "This name never expires and no parent holds a role that can reach it.";

const withAdmin = (role: bigint) => role | (role << 128n);

/** Enough to register once and wire the entry. All of it is surrendered in step 4. */
const FOREVER_REGISTRY_ROLES =
  withAdmin(REGISTRY_ROLE.REGISTRAR) |
  withAdmin(REGISTRY_ROLE.RENEW) |
  withAdmin(REGISTRY_ROLE.SET_SUBREGISTRY) |
  withAdmin(REGISTRY_ROLE.SET_RESOLVER) |
  withAdmin(REGISTRY_ROLE.UPGRADE);

/** What the holder keeps. No CAN_TRANSFER_ADMIN: forever, and to this holder only. */
const HOLDER_ROLES =
  withAdmin(REGISTRY_ROLE.SET_RESOLVER) |
  withAdmin(REGISTRY_ROLE.SET_SUBREGISTRY);

/**
 * A name that never expires and that its parent cannot reach.
 *
 * Two separate properties, and both have to be arranged deliberately:
 *
 *   forever          expiry = type(uint64).max, so the parent can never
 *                    re-register the label out from under the holder
 *   no parent control  the registry's root roles are revoked after the one
 *                    registration, so nobody holds the master key that EAC
 *                    grants over every entry in a registry
 *
 * It needs its own registry. `revokeRootRoles` is registry-wide, so doing this
 * on the Air Index registry would surrender control of every index at once and
 * make it impossible to publish another.
 */
const run = async () => {
  assert.ok(SLUG, "usage: pnpm forever-name <slug> [label]");

  const registry = process.env.NEXT_PUBLIC_AIR_INDEX_REGISTRY as `0x${string}`;
  assert.ok(registry, "NEXT_PUBLIC_AIR_INDEX_REGISTRY is missing");

  const { account, client } = getWallet();
  await requireFunds(account.address);

  const parentName = `${SLUG}.${PROTOCOL_ROOT}`;
  const foreverName = `${LABEL}.${parentName}`;

  const resolver = (await publicClient.readContract({
    address: registry,
    abi: permissionedRegistryAbi,
    functionName: "getResolver",
    args: [SLUG],
  })) as `0x${string}`;
  assert.notEqual(resolver, ZERO_ADDRESS, `${parentName} is not registered`);

  console.log(`parent   ${parentName}`);
  console.log(`forever  ${foreverName}`);

  console.log("\n1. deploy a registry that will hold exactly one name");
  const deployReceipt = await logTx(
    "deployProxy",
    await client.writeContract({
      address: ENS_DEPLOYMENT.verifiableFactory,
      abi: verifiableFactoryAbi,
      functionName: "deployProxy",
      args: [
        ENS_DEPLOYMENT.userRegistryImpl,
        BigInt(Date.now()),
        encodeFunctionData({
          abi: userRegistryAbi,
          functionName: "initialize",
          args: [account.address, FOREVER_REGISTRY_ROLES],
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
  const foreverRegistry = proxyEvent.args.proxyAddress as `0x${string}`;
  console.log(`  registry ${foreverRegistry}`);

  console.log(`\n2. register ${LABEL} with an expiry that never arrives`);
  await logTx(
    "register",
    await client.writeContract({
      address: foreverRegistry,
      abi: permissionedRegistryAbi,
      functionName: "register",
      args: [
        LABEL,
        account.address,
        ZERO_ADDRESS,
        resolver,
        HOLDER_ROLES,
        MAX_UINT64,
      ],
    }),
  );

  console.log(`\n3. publish a record at the forever name`);
  await logTx(
    "setText",
    await client.writeContract({
      address: resolver,
      abi: permissionedResolverAbi,
      functionName: "setText",
      args: [toNode(foreverName), CHARTER_KEY, CHARTER],
    }),
  );

  console.log(`\n4. hang it under ${parentName}`);
  await logTx(
    "setSubregistry",
    await client.writeContract({
      address: registry,
      abi: permissionedRegistryAbi,
      functionName: "setSubregistry",
      args: [
        (await publicClient.readContract({
          address: registry,
          abi: permissionedRegistryAbi,
          functionName: "findTokenId",
          args: [SLUG],
        })) as bigint,
        foreverRegistry,
      ],
    }),
  );

  /**
   * The parent's constituents are wildcard subnames with no registry entry.
   * Hanging a subregistry off the parent adds a step to the resolution walk, so
   * check it still falls through before going any further — this is recoverable
   * with setSubregistry(tokenId, 0) and nothing after this point is.
   */
  const probe = await readConstituentLabels(parentName);
  const stillResolves = await ensClient.getEnsAddress({
    name: `${probe[0]}.${parentName}`,
  });
  console.log(`  ${probe[0]}.${parentName} -> ${stillResolves ?? "BROKEN"}`);
  assert.ok(
    stillResolves,
    `attaching a subregistry broke wildcard resolution on ${parentName}. Undo with setSubregistry(tokenId, 0).`,
  );

  console.log("\n5. the parent surrenders its master key, permanently");
  await logTx(
    "revokeRootRoles",
    await client.writeContract({
      address: foreverRegistry,
      abi: permissionedRegistryAbi,
      functionName: "revokeRootRoles",
      args: [FOREVER_REGISTRY_ROLES, account.address],
    }),
  );

  console.log("\n6. read the result back");
  const [expiry, owner, roleCount] = await Promise.all([
    publicClient.readContract({
      address: foreverRegistry,
      abi: permissionedRegistryAbi,
      functionName: "findExpiry",
      args: [LABEL],
    }),
    publicClient.readContract({
      address: foreverRegistry,
      abi: permissionedRegistryAbi,
      functionName: "findOwner",
      args: [LABEL],
    }),
    publicClient.readContract({
      address: foreverRegistry,
      abi: permissionedRegistryAbi,
      functionName: "roleCount",
      args: [0n],
    }),
  ]);

  console.log(
    `  expiry     ${expiry}${expiry === MAX_UINT64 ? " (max uint64)" : ""}`,
  );
  console.log(`  owner      ${owner}`);
  console.log(`  root roles ${roleCount}`);
  assert.equal(expiry, MAX_UINT64, "the name must never expire");
  assert.equal(
    roleCount,
    0n,
    "no account may hold a root role on this registry",
  );

  console.log("\n7. the parent must now be unable to register or repoint");
  await assert.rejects(
    publicClient.simulateContract({
      account,
      address: foreverRegistry,
      abi: permissionedRegistryAbi,
      functionName: "register",
      args: [
        "usurper",
        account.address,
        ZERO_ADDRESS,
        resolver,
        HOLDER_ROLES,
        MAX_UINT64,
      ],
    }),
    "the parent must not be able to register another name",
  );
  console.log("  register: refused");

  console.log("\n8. and it still resolves");
  const published = await ensClient
    .getEnsText({ name: foreverName, key: CHARTER_KEY })
    .catch(() => null);
  console.log(`  ${foreverName} text("${CHARTER_KEY}") = ${published}`);
  assert.equal(published, CHARTER, "the forever name must resolve its charter");

  console.log(
    `\n${foreverName} is permanent, and its parent cannot take it back`,
  );
  console.log(
    `  caveat: ${parentName} still holds SET_SUBREGISTRY and could unhook this registry.\n` +
      "  The name and its records survive that; only the path to them changes.",
  );
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
