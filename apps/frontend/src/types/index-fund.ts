export const TOKEN_SYMBOLS = [
  "btc",
  "eth",
  "weth",
  "wbtc",
  "sol",
  "xrp",
  "doge",
  "uni",
  "aave",
  "mkr",
  "ldo",
  "crv",
  "link",
  "comp",
  "snx",
  "arb",
  "op",
  "matic",
  "usdc",
  "usdt",
  "dai",
  "avax",
  "dot",
  "ada",
  "rpl",
  "fxs",
  "rndr",
  "fet",
  "inj",
  "tia",
  "sui",
  "apt",
  "near",
  "atom",
] as const;

export type TokenSymbol = (typeof TOKEN_SYMBOLS)[number];

/**
 * Display metadata for a symbol. The address comes from a deployment receipt;
 * the name and decimals are a local registry, because a token contract's
 * symbol is not something the index publishes.
 */
export interface Token {
  symbol: TokenSymbol;
  name: string;
  /** Zero for a native asset, and for anything not yet deployed to Sepolia. */
  address: `0x${string}`;
  decimals: number;
}

export interface Constituent {
  token: Token;
  weightBps: number;
}

export const SWAP_MODES = ["deposit", "swap", "redeem"] as const;

export type SwapMode = (typeof SWAP_MODES)[number];
