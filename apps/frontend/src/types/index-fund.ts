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

export interface Token {
  symbol: TokenSymbol;
  name: string;
  address: `0x${string}`;
}

export interface Constituent {
  token: Token;
  weightBps: number;
}

export interface Rebalancer {
  label: string;
  address: `0x${string}`;
  mandate: string;
  delegatedKey: string;
}

export interface IndexFund {
  slug: string;
  ensName: string;
  ticker: string | null;
  name: string;
  description: string;
  constituents: Constituent[];
  allTimeReturnPct: number;
  dayReturnPct: number;
  holders: number;
  totalDepositsUsd: number;
  isMethodologyLocked: boolean;
  methodologyCid: string;
  creator: `0x${string}`;
  rebalancer: Rebalancer | null;
}

export interface IndexCollection {
  id: string;
  title: string;
  indexes: IndexFund[];
}

export interface PortfolioPosition {
  index: IndexFund;
  valueUsd: number;
  dayChangePct: number;
}

export interface QuoteAsset {
  token: Token;
  priceUsd: number;
  balance: number;
}

export const SWAP_MODES = ["deposit", "swap", "redeem"] as const;

export type SwapMode = (typeof SWAP_MODES)[number];

export const SWAP_ROUTES = ["direct", "aggregator"] as const;

export type SwapRoute = (typeof SWAP_ROUTES)[number];
