import type { PortfolioPosition, Token } from "@/types/index-fund";

const BASIS_POINTS_PER_UNIT = 10_000;

export interface AllocationSlice {
  token: Token;
  valueUsd: number;
  shareBps: number;
}

export const getPortfolioValueUsd = (positions: PortfolioPosition[]): number =>
  positions.reduce((total, position) => total + position.valueUsd, 0);

export const getWeightedDayChangePct = (
  positions: PortfolioPosition[],
): number => {
  const totalValueUsd = getPortfolioValueUsd(positions);
  if (totalValueUsd === 0) {
    return 0;
  }
  return positions.reduce(
    (total, position) =>
      total + position.dayChangePct * (position.valueUsd / totalValueUsd),
    0,
  );
};

export const getPortfolioAllocation = (
  positions: PortfolioPosition[],
): AllocationSlice[] => {
  const totalValueUsd = getPortfolioValueUsd(positions);
  const exposureByToken = new Map<string, AllocationSlice>();

  for (const position of positions) {
    for (const constituent of position.index.constituents) {
      const valueUsd =
        (position.valueUsd * constituent.weightBps) / BASIS_POINTS_PER_UNIT;
      const existing = exposureByToken.get(constituent.token.symbol);
      exposureByToken.set(constituent.token.symbol, {
        token: constituent.token,
        valueUsd: (existing?.valueUsd ?? 0) + valueUsd,
        shareBps: 0,
      });
    }
  }

  return [...exposureByToken.values()]
    .map((slice) => ({
      ...slice,
      shareBps:
        totalValueUsd === 0
          ? 0
          : (slice.valueUsd / totalValueUsd) * BASIS_POINTS_PER_UNIT,
    }))
    .sort((first, second) => second.valueUsd - first.valueUsd);
};
