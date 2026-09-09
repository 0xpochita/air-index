import { findToken } from "@/lib/mock/tokens";
import type { Constituent } from "@/types/index-fund";
import type { OnchainConstituent } from "./read";

/**
 * Addresses and weights come from the resolver, names and icons are local
 * display metadata. A symbol with no local entry is still rendered, so an
 * unrecognised constituent is visible rather than silently dropped.
 */
export const toDisplayConstituents = (
  onchain: OnchainConstituent[],
): Constituent[] =>
  onchain.map((constituent) => {
    const token = findToken(constituent.symbol);

    return {
      token: {
        symbol: token?.symbol ?? constituent.symbol,
        name: token?.name ?? constituent.symbol.toUpperCase(),
        address: (constituent.address ??
          token?.address ??
          "0x") as `0x${string}`,
      },
      weightBps: constituent.weightBps ?? 0,
    } as Constituent;
  });
