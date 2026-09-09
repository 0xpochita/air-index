import assert from "node:assert/strict";
import { loadEnv } from "./lib/env";

loadEnv();

const run = async () => {
  const { fetchOnchainIndex, listPublishedSlugs } = await import(
    "../src/lib/ens/indexes"
  );

  const slugs = await listPublishedSlugs();
  console.log(`published slugs: ${slugs.join(", ") || "(none)"}`);
  assert.ok(
    slugs.length > 0,
    "the registry must have at least one LabelRegistered event",
  );

  for (const slug of slugs) {
    const index = await fetchOnchainIndex(slug);
    assert.ok(index, `${slug} must resolve`);

    console.log(`\n${index.ensName}`);
    console.log(`  owner      ${index.owner}`);
    console.log(`  resolver   ${index.resolver}`);
    console.log(`  verified   ${index.isVerifiedResolver}`);
    console.log(`  locked     ${index.isMethodologyLocked}`);
    console.log(`  desc       ${index.description}`);

    for (const constituent of index.constituents) {
      console.log(
        `  ${constituent.symbol.padEnd(6)} ${constituent.address ?? "native"} ${constituent.weightBps}`,
      );
      assert.ok(
        constituent.weightBps,
        `${constituent.ensName} must resolve a weight`,
      );
    }

    const total = index.constituents.reduce(
      (sum, constituent) => sum + (constituent.weightBps ?? 0),
      0,
    );
    console.log(`  weights    ${total} bps`);
    assert.equal(total, 10_000, "published weights must total 100%");
  }

  console.log("\nonchain read layer: PASS");
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
