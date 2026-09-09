import assert from "node:assert/strict";
import { permissionedRegistryAbi } from "../src/lib/ens/abis/PermissionedRegistry";
import { permissionedResolverAbi } from "../src/lib/ens/abis/PermissionedResolver";
import { toNode } from "../src/lib/ens/name";
import { loadEnv } from "./lib/env";
import { getAgentWallet, logTx, publicClient } from "./lib/wallet";

loadEnv();

const WEIGHT_KEY = "weight";
const TOTAL_WEIGHT_BPS = 10_000;

const [, , indexName, symbol, weight] = process.argv;

/**
 * Runs as the delegated agent, not the owner, so a successful run is itself
 * evidence that record scoped delegation works.
 */
const run = async () => {
  assert.ok(
    indexName && symbol && weight,
    "usage: pnpm rebalance <index.airindex.eth> <symbol> <weightBps>",
  );

  const registry = process.env.NEXT_PUBLIC_AIR_INDEX_REGISTRY as `0x${string}`;
  assert.ok(registry, "NEXT_PUBLIC_AIR_INDEX_REGISTRY is missing");

  const agent = getAgentWallet();
  const slug = indexName.split(".")[0];
  const resolver = await publicClient.readContract({
    address: registry,
    abi: permissionedRegistryAbi,
    functionName: "getResolver",
    args: [slug],
  });

  const constituentName = `${symbol}.${indexName}`;
  console.log(`agent    ${agent.account.address}`);
  console.log(`resolver ${resolver}`);
  console.log(`setting  ${constituentName} ${WEIGHT_KEY}=${weight}`);

  await logTx(
    "setText",
    await agent.client.writeContract({
      address: resolver,
      abi: permissionedResolverAbi,
      functionName: "setText",
      args: [toNode(constituentName), WEIGHT_KEY, weight],
    }),
  );

  const labels = (
    (await publicClient.readContract({
      address: resolver,
      abi: permissionedResolverAbi,
      functionName: "text",
      args: [toNode(indexName), "constituents"],
    })) as string
  )
    .split(",")
    .filter(Boolean);

  const weights = await Promise.all(
    labels.map((label) =>
      publicClient.readContract({
        address: resolver,
        abi: permissionedResolverAbi,
        functionName: "text",
        args: [toNode(`${label}.${indexName}`), WEIGHT_KEY],
      }),
    ),
  );

  const total = weights.reduce(
    (sum, value) => sum + Number.parseInt(value as string, 10),
    0,
  );
  console.log(`\nallocation now ${total} bps`);
  labels.forEach((label, position) => {
    console.log(`  ${label.padEnd(6)} ${weights[position]}`);
  });

  assert.equal(total, TOTAL_WEIGHT_BPS, "the index must stay fully allocated");
  console.log("\nrebalance complete, index fully allocated");
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
