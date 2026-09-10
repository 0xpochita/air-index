import assert from "node:assert/strict";
import { permissionedRegistryAbi } from "../src/lib/ens/abis/PermissionedRegistry";
import { permissionedResolverAbi } from "../src/lib/ens/abis/PermissionedResolver";
import { ensClient } from "../src/lib/ens/client";
import { PROTOCOL_ROOT } from "../src/lib/ens/deployments";
import { listPublishedSlugs } from "../src/lib/ens/indexes";
import { toDnsEncoded } from "../src/lib/ens/name";
import { REGISTRY_ROLE } from "../src/lib/ens/roles";
import { loadEnv } from "./lib/env";
import { getWallet, logTx, publicClient, requireFunds } from "./lib/wallet";

loadEnv();

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000" as const;
const ONE_YEAR_SECONDS = 31_536_000n;
const CONSTITUENTS_KEY = "constituents";
const LABEL = process.argv[2] ?? "funds";

const withAdmin = (role: bigint) => role | (role << 128n);

const MIRROR_ROLES =
  withAdmin(REGISTRY_ROLE.SET_RESOLVER) |
  withAdmin(REGISTRY_ROLE.SET_SUBREGISTRY) |
  REGISTRY_ROLE.CAN_TRANSFER_ADMIN;

/**
 * Namespace aliasing: a second name whose subregistry is the Air Index registry
 * itself, so every index appears under it without being registered twice.
 * `big-five.funds.airindex.eth` and `big-five.airindex.eth` are the same
 * ERC-1155 entry — transfer one and both move.
 *
 * Sharing the registry is only half of it. Resolution hashes the *full* name, so
 * the mirrored name reaches the right resolver and finds nothing there. Record
 * aliasing supplies the other half, which is why this script does both.
 */
const run = async () => {
  const registry = process.env.NEXT_PUBLIC_AIR_INDEX_REGISTRY as `0x${string}`;
  assert.ok(registry, "NEXT_PUBLIC_AIR_INDEX_REGISTRY is missing");

  const { account, client } = getWallet();
  await requireFunds(account.address);

  const mirrorName = `${LABEL}.${PROTOCOL_ROOT}`;
  console.log(`mirror   ${mirrorName}`);
  console.log(`registry ${registry}`);

  console.log(
    `\n1. register ${LABEL} pointing its subregistry at the registry`,
  );
  const existingOwner = await publicClient.readContract({
    address: registry,
    abi: permissionedRegistryAbi,
    functionName: "findOwner",
    args: [LABEL],
  });

  if (existingOwner === ZERO_ADDRESS) {
    await logTx(
      "register",
      await client.writeContract({
        address: registry,
        abi: permissionedRegistryAbi,
        functionName: "register",
        args: [
          LABEL,
          account.address,
          registry,
          ZERO_ADDRESS,
          MIRROR_ROLES,
          BigInt(Math.floor(Date.now() / 1000)) + ONE_YEAR_SECONDS,
        ],
      }),
    );
  } else {
    console.log(`  already registered to ${existingOwner}`);
  }

  const subregistry = await publicClient.readContract({
    address: registry,
    abi: permissionedRegistryAbi,
    functionName: "getSubregistry",
    args: [LABEL],
  });
  console.log(`  subregistry ${subregistry}`);
  assert.equal(
    (subregistry as string).toLowerCase(),
    registry.toLowerCase(),
    "the mirror must delegate to the air index registry",
  );

  const slugs = (await listPublishedSlugs()).filter((slug) => slug !== LABEL);

  console.log("\n2. alias each index's records onto the mirrored name");
  const mirrored: string[] = [];

  for (const slug of slugs) {
    const resolver = (await publicClient.readContract({
      address: registry,
      abi: permissionedRegistryAbi,
      functionName: "getResolver",
      args: [slug],
    })) as `0x${string}`;

    if (resolver === ZERO_ADDRESS) {
      continue;
    }

    const from = `${slug}.${mirrorName}`;
    const call = {
      address: resolver,
      abi: permissionedResolverAbi,
      functionName: "setAlias" as const,
      args: [
        toDnsEncoded(from),
        toDnsEncoded(`${slug}.${PROTOCOL_ROOT}`),
      ] as const,
    };

    /** Simulated first: a resolver without SET_ALIAS reverts, and gas spent on that is gas wasted. */
    try {
      await publicClient.simulateContract({ ...call, account });
    } catch {
      console.log(
        `  ${slug.padEnd(12)} skipped, its resolver has no SET_ALIAS`,
      );
      continue;
    }

    await logTx(`alias ${slug}`, await client.writeContract(call));
    mirrored.push(slug);
  }

  console.log("\n3. both names must resolve identically");
  for (const slug of mirrored) {
    const [canonical, mirror] = await Promise.all([
      ensClient.getEnsText({
        name: `${slug}.${PROTOCOL_ROOT}`,
        key: CONSTITUENTS_KEY,
      }),
      ensClient.getEnsText({
        name: `${slug}.${mirrorName}`,
        key: CONSTITUENTS_KEY,
      }),
    ]);

    console.log(`  ${`${slug}.${mirrorName}`.padEnd(38)} ${mirror}`);
    assert.equal(
      mirror,
      canonical,
      `${slug}.${mirrorName} must resolve to the same records`,
    );
  }

  assert.ok(mirrored.length > 0, "no index could be mirrored");
  console.log(
    `\n${mirrorName} mirrors ${mirrored.length} index(es) off one registry`,
  );
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
