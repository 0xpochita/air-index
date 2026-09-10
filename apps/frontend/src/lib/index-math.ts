import type { IndexFund } from "@/types/index-fund";

export const INCEPTION_UNIT_PRICE_USD = 100;

/**
 * The price an index launches at, before any vault exists to quote it. Once a
 * share token is published the vault's own `sharePrice` is authoritative and
 * this is only used to pick the launch price in `wire-index`.
 */
export const getUnitPriceUsd = (index: IndexFund): number =>
  INCEPTION_UNIT_PRICE_USD * (1 + index.allTimeReturnPct / 100);
