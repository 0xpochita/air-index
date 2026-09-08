import type { IndexFund, QuoteAsset, SwapRoute } from "@/types/index-fund";

export const INCEPTION_UNIT_PRICE_USD = 100;

const ROUTE_FEE_BPS: Record<SwapRoute, number> = {
  direct: 0,
  aggregator: 30,
};

const ROUTE_PRICE_IMPACT_BPS: Record<SwapRoute, number> = {
  direct: 0,
  aggregator: 5,
};

const BASIS_POINTS_PER_UNIT = 10_000;

export const getUnitPriceUsd = (index: IndexFund): number =>
  INCEPTION_UNIT_PRICE_USD * (1 + index.allTimeReturnPct / 100);

export const getRouteFeeBps = (route: SwapRoute): number =>
  ROUTE_FEE_BPS[route];

export const getRoutePriceImpactBps = (route: SwapRoute): number =>
  ROUTE_PRICE_IMPACT_BPS[route];

export const applyRouteCost = (amount: number, route: SwapRoute): number => {
  const costBps = ROUTE_FEE_BPS[route] + ROUTE_PRICE_IMPACT_BPS[route];
  return amount * (1 - costBps / BASIS_POINTS_PER_UNIT);
};

export const quoteAssetToUnits = (
  amount: number,
  asset: QuoteAsset,
  index: IndexFund,
): number => (amount * asset.priceUsd) / getUnitPriceUsd(index);

export const unitsToQuoteAsset = (
  units: number,
  index: IndexFund,
  asset: QuoteAsset,
): number => (units * getUnitPriceUsd(index)) / asset.priceUsd;

export const unitsToUnits = (
  units: number,
  from: IndexFund,
  to: IndexFund,
): number => (units * getUnitPriceUsd(from)) / getUnitPriceUsd(to);
