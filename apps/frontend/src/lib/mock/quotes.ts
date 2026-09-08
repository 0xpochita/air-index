import type { QuoteAsset } from "@/types/index-fund";
import { TOKENS } from "./tokens";

const QUOTE_ASSETS: QuoteAsset[] = [
  { token: TOKENS.usdc, priceUsd: 1, balance: 12_480.52 },
  { token: TOKENS.weth, priceUsd: 3_142.88, balance: 2.4183 },
  { token: TOKENS.wbtc, priceUsd: 68_402.15, balance: 0.0715 },
  { token: TOKENS.dai, priceUsd: 0.999, balance: 3_050.0 },
];

export const getQuoteAssets = (): QuoteAsset[] => QUOTE_ASSETS;

export const getDefaultQuoteAsset = (): QuoteAsset => QUOTE_ASSETS[0];

export const getIndexUnitBalance = (slug: string): number =>
  ({ "big-five": 41.82, "defi-blue": 15.54, "safe-stables": 8.12 })[slug] ?? 0;
