import assert from "node:assert/strict";
import { formatUnits } from "viem";
import { indexVaultAbi } from "../src/lib/onchain/abis";
import { loadEnv } from "./lib/env";
import { publicClient } from "./lib/wallet";

loadEnv();

const ONE_WHOLE_QUOTE = 1_000_000n;

const run = async () => {
  const { fetchOnchainIndex, listPublishedSlugs } = await import(
    "../src/lib/ens/indexes"
  );
  const { SETTLEMENT_SYMBOL } = await import("../src/lib/settlement");
  const { TOKENS } = await import("../src/lib/tokens/registry");

  const quote = TOKENS[SETTLEMENT_SYMBOL];
  const slugs = await listPublishedSlugs();
  console.log(`published slugs: ${slugs.join(", ") || "(none)"}`);
  assert.ok(
    slugs.length > 0,
    "the registry must have at least one LabelRegistered event",
  );

  for (const slug of slugs) {
    const index = await fetchOnchainIndex(slug);

    /**
     * A registered label with no resolver is a namespace node, not a broken
     * index — `funds` exists to lend its subregistry, and holds no records.
     */
    if (!index) {
      console.log(`\n${slug}: namespace node, no resolver`);
      continue;
    }

    console.log(`\n${index.ensName}`);
    console.log(`  owner      ${index.owner}`);
    console.log(`  resolver   ${index.resolver}`);
    console.log(`  verified   ${index.isVerifiedResolver}`);
    console.log(`  locked     ${index.isMethodologyLocked}`);
    console.log(`  share      ${index.shareToken ?? "not published"}`);
    console.log(
      `  agent      ${index.agent ? `${index.agent.address} scoped to "${index.agent.delegatedKey}"` : "none"}`,
    );
    console.log(
      `  transfer   ${index.isTransferable ? "transferable" : "soulbound"}`,
    );
    console.log(
      `  expires    ${new Date(Number(index.expiry) * 1000).toISOString().slice(0, 10)}`,
    );
    console.log(`  desc       ${index.description}`);

    for (const constituent of index.constituents) {
      console.log(
        `  ${constituent.symbol.padEnd(6)} ${constituent.address ?? "native"} ${constituent.weightBps}`,
      );
      assert.ok(
        constituent.weightBps,
        `${constituent.ensName} must resolve a weight`,
      );

      if (constituent.address) {
        const code = await publicClient.getCode({
          address: constituent.address,
        });
        assert.ok(
          code && code !== "0x",
          `${constituent.ensName} resolves to ${constituent.address}, which has no bytecode on Sepolia`,
        );
      }
    }

    const total = index.constituents.reduce(
      (sum, constituent) => sum + (constituent.weightBps ?? 0),
      0,
    );
    console.log(`  weights    ${total} bps`);
    assert.equal(total, 10_000, "published weights must total 100%");

    if (!index.shareToken) {
      console.log("  vault      skipped, run pnpm wire-index to publish one");
      continue;
    }

    const [vaultQuote, sharePrice, shares] = await Promise.all([
      publicClient.readContract({
        address: index.shareToken,
        abi: indexVaultAbi,
        functionName: "quote",
      }),
      publicClient.readContract({
        address: index.shareToken,
        abi: indexVaultAbi,
        functionName: "sharePrice",
      }),
      publicClient.readContract({
        address: index.shareToken,
        abi: indexVaultAbi,
        functionName: "previewDeposit",
        args: [ONE_WHOLE_QUOTE],
      }),
    ]);

    const returned = await publicClient.readContract({
      address: index.shareToken,
      abi: indexVaultAbi,
      functionName: "previewRedeem",
      args: [shares],
    });

    console.log(
      `  vault      ${formatUnits(sharePrice, quote.decimals)} m${SETTLEMENT_SYMBOL.toUpperCase()} per share`,
    );
    console.log(
      `  roundtrip  ${formatUnits(ONE_WHOLE_QUOTE, quote.decimals)} in, ${formatUnits(returned, quote.decimals)} out`,
    );

    assert.equal(
      vaultQuote.toLowerCase(),
      quote.address.toLowerCase(),
      "the vault must settle in the deployed quote token",
    );
    assert.ok(shares > 0n, "a whole quote unit must buy a non-zero share");
    /** Rounding may only ever favour the vault, or it can be drained by looping. */
    assert.ok(
      returned <= ONE_WHOLE_QUOTE,
      "a deposit and redeem round trip must never return more than it took",
    );
  }

  console.log("\nonchain read layer: PASS");
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
