import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { QUOTE_SYMBOLS } from "../src/lib/settlement";
import { getTokenDecimals, TOKENS } from "../src/lib/tokens/registry";
import { TOKEN_SYMBOLS, type TokenSymbol } from "../src/types/index-fund";
import { readArtifact } from "./lib/artifacts";
import { loadEnv } from "./lib/env";
import { getWallet, publicClient, requireFunds } from "./lib/wallet";

loadEnv();

const CATALOGUE_PATH = path.resolve(
  process.cwd(),
  "src/lib/tokens/sepolia.json",
);
const CHAIN_ID = 11_155_111;
const FAUCET_WHOLE_UNITS = 1_000n;
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

interface Catalogue {
  chainId: number;
  tokens: Record<string, `0x${string}`>;
}

const readCatalogue = (): Catalogue => {
  const raw = JSON.parse(fs.readFileSync(CATALOGUE_PATH, "utf8")) as Catalogue;
  return { chainId: CHAIN_ID, tokens: raw.tokens ?? {} };
};

/** Rewritten after every deploy so a crash mid-run never loses an address. */
const writeCatalogue = (catalogue: Catalogue) => {
  const ordered = Object.fromEntries(
    TOKEN_SYMBOLS.flatMap((symbol) =>
      catalogue.tokens[symbol] ? [[symbol, catalogue.tokens[symbol]]] : [],
    ),
  );
  fs.writeFileSync(
    CATALOGUE_PATH,
    `${JSON.stringify({ chainId: CHAIN_ID, tokens: ordered }, null, 2)}\n`,
  );
};

/**
 * Default to exactly what the published indexes need plus the quote assets.
 * Deploying the whole 33 symbol catalogue costs real testnet ether for tokens
 * nothing references yet, so the rest are opt in:
 *   pnpm deploy-tokens link,snx,arb
 */
const resolveDefaultSymbols = async (): Promise<TokenSymbol[]> => {
  const { fetchLiveIndexes } = await import("../src/lib/onchain/vaults");

  const indexes = await fetchLiveIndexes().catch(() => []);
  const constituents = indexes.flatMap((index) =>
    index.constituents.map((entry) => entry.token.symbol),
  );

  return [...new Set<TokenSymbol>([...QUOTE_SYMBOLS, ...constituents])];
};

const parseSymbols = async (
  raw: string | undefined,
): Promise<TokenSymbol[]> => {
  if (!raw) {
    return resolveDefaultSymbols();
  }

  if (raw === "all") {
    return [...TOKEN_SYMBOLS];
  }

  return raw.split(",").map((entry) => {
    const symbol = entry.trim().toLowerCase();
    assert.ok(symbol in TOKENS, `unknown token symbol: ${symbol}`);
    return symbol as TokenSymbol;
  });
};

const hasBytecode = async (address: `0x${string}`): Promise<boolean> => {
  const code = await publicClient.getCode({ address });
  return Boolean(code && code !== "0x");
};

const run = async () => {
  const requested = await parseSymbols(process.argv[2]);
  /** `eth` is native. There is no ERC20 to deploy and no balance to read. */
  const symbols = requested.filter((symbol) => symbol !== "eth");

  const { account, client } = getWallet();
  const { abi, bytecode } = readArtifact("MockERC20");
  const catalogue = readCatalogue();

  console.log(`deployer ${account.address}`);
  await requireFunds(account.address);
  console.log(`\n${symbols.length} mock ERC20s: ${symbols.join(", ")}`);

  for (const symbol of symbols) {
    const existing = catalogue.tokens[symbol];

    if (
      existing &&
      existing !== ZERO_ADDRESS &&
      (await hasBytecode(existing))
    ) {
      console.log(`  ${symbol.padEnd(6)} ${existing} (already deployed)`);
      continue;
    }

    const decimals = getTokenDecimals(symbol);
    const hash = await client.deployContract({
      abi,
      bytecode,
      args: [
        `Mock ${TOKENS[symbol].name}`,
        `m${symbol.toUpperCase()}`,
        decimals,
        FAUCET_WHOLE_UNITS * 10n ** BigInt(decimals),
      ],
    });
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    assert.equal(receipt.status, "success", `${symbol} deploy reverted`);
    assert.ok(receipt.contractAddress, `${symbol} produced no address`);

    catalogue.tokens[symbol] = receipt.contractAddress;
    writeCatalogue(catalogue);

    console.log(
      `  ${symbol.padEnd(6)} ${receipt.contractAddress} (${decimals}d, gas ${receipt.gasUsed})`,
    );
  }

  console.log(`\nwrote ${CATALOGUE_PATH}`);
  console.log(
    "next: pnpm wire-index <slug> to publish these onto the ENS records",
  );
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
