import type { TokenSymbol } from "@/types/index-fund";

/** Assets a deposit can be paid in. Every one of them is a deployed mock ERC20. */
export const QUOTE_SYMBOLS = [
  "usdc",
  "weth",
  "wbtc",
  "dai",
] as const satisfies readonly TokenSymbol[];

export type QuoteSymbol = (typeof QUOTE_SYMBOLS)[number];

/**
 * Still mock, and deliberately so. Balances are read from the chain but there
 * is no price feed on Sepolia worth trusting, so valuations are fixed marks.
 */
export const QUOTE_PRICE_USD: Record<QuoteSymbol, number> = {
  usdc: 1,
  weth: 3_142.88,
  wbtc: 68_402.15,
  dai: 0.999,
};

/** The asset every vault settles in, so it is what `deposit` pulls. */
export const SETTLEMENT_SYMBOL: QuoteSymbol = "usdc";
