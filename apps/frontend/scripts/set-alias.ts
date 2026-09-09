import assert from "node:assert/strict";
import { permissionedRegistryAbi } from "../src/lib/ens/abis/PermissionedRegistry";
import { permissionedResolverAbi } from "../src/lib/ens/abis/PermissionedResolver";
import { ensClient } from "../src/lib/ens/client";
import { PROTOCOL_ROOT } from "../src/lib/ens/deployments";
import { toDnsEncoded } from "../src/lib/ens/name";
import { REGISTRY_ROLE } from "../src/lib/ens/roles";
import { loadEnv } from "./lib/env";
import { getWallet, logTx, publicClient, requireFunds } from "./lib/wallet";

loadEnv();

const ONE_YEAR_SECONDS = 31_536_000n;
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000" as const;
const CONSTITUENTS_KEY = "constituents";

const [, , aliasLabel, targetSlug] = process.argv;

const withAdmin = (role: bigint) => role | (role << 128n);

const ALIAS_ROLES =
  withAdmin(REGISTRY_ROLE.SET_RESOLVER) | REGISTRY_ROLE.CAN_TRANSFER_ADMIN;

/**
 * Tickers and mirrors are the same primitive: a second name pointed at the same
 * resolver, then aliased to the canonical one. Aliasing only works within a
 * single resolver instance, so the alias has to be registered onto the target's
 * resolver rather than the protocol one.
 */
const run = async () => {
  assert.ok(
    aliasLabel && targetSlug,
    "usage: pnpm set-alias <aliasLabel> <targetSlug>",
  );

  const registry = process.env.NEXT_PUBLIC_AIR_INDEX_REGISTRY as `0x${string}`;
  assert.ok(registry, "NEXT_PUBLIC_AIR_INDEX_REGISTRY is missing");

  const { account, client } = getWallet();
  await requireFunds(account.address);

  const aliasName = `${aliasLabel}.${PROTOCOL_ROOT}`;
  const targetName = `${targetSlug}.${PROTOCOL_ROOT}`;

  const resolver = await publicClient.readContract({
    address: registry,
    abi: permissionedRegistryAbi,
    functionName: "getResolver",
    args: [targetSlug],
  });
  assert.notEqual(resolver, ZERO_ADDRESS, `${targetName} has no resolver`);

  console.log(`alias    ${aliasName}`);
  console.log(`target   ${targetName}`);
  console.log(`resolver ${resolver}`);

  const existingOwner = await publicClient.readContract({
    address: registry,
    abi: permissionedRegistryAbi,
    functionName: "findOwner",
    args: [aliasLabel],
  });

  if (existingOwner === ZERO_ADDRESS) {
    console.log(`\n1. register ${aliasName} onto the same resolver`);
    await logTx(
      "register",
      await client.writeContract({
        address: registry,
        abi: permissionedRegistryAbi,
        functionName: "register",
        args: [
          aliasLabel,
          account.address,
          ZERO_ADDRESS,
          resolver,
          ALIAS_ROLES,
          BigInt(Math.floor(Date.now() / 1000)) + ONE_YEAR_SECONDS,
        ],
      }),
    );
  } else {
    console.log(`\n1. ${aliasName} already registered to ${existingOwner}`);
  }

  console.log("\n2. point the alias at the canonical name");
  await logTx(
    "setAlias",
    await client.writeContract({
      address: resolver,
      abi: permissionedResolverAbi,
      functionName: "setAlias",
      args: [toDnsEncoded(aliasName), toDnsEncoded(targetName)],
    }),
  );

  console.log("\n3. both names must resolve identically");
  const [aliasConstituents, targetConstituents] = await Promise.all([
    ensClient.getEnsText({ name: aliasName, key: CONSTITUENTS_KEY }),
    ensClient.getEnsText({ name: targetName, key: CONSTITUENTS_KEY }),
  ]);

  console.log(`  ${aliasName.padEnd(30)} ${aliasConstituents}`);
  console.log(`  ${targetName.padEnd(30)} ${targetConstituents}`);

  assert.ok(targetConstituents, "the target must publish a constituent list");
  assert.equal(
    aliasConstituents,
    targetConstituents,
    "the alias must resolve to the same records as the target",
  );

  console.log(`\n${aliasName} now mirrors ${targetName}`);
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
