import { toDisplayConstituents } from "@/lib/ens/constituents";
import { fetchOnchainIndexes, type OnchainIndex } from "@/lib/ens/indexes";
import { getIndexBySlug } from "@/lib/mock/indexes";
import type { IndexFund } from "@/types/index-fund";

export interface LiveIndex {
  slug: string;
  ensName: string;
  /** The share token, read from `addr(60)` on the index name itself. */
  vault: `0x${string}` | null;
  fund: IndexFund;
}

const toTitle = (slug: string): string =>
  slug
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

/**
 * Chain data wins for anything the chain publishes. The local catalogue only
 * supplies what ENS has no opinion about — returns, holder counts, the copy on
 * the marketing cards.
 */
const toFund = (onchain: OnchainIndex): IndexFund => {
  const constituents = toDisplayConstituents(onchain.constituents);
  const local = getIndexBySlug(onchain.slug);

  if (local) {
    return {
      ...local,
      description: onchain.description ?? local.description,
      constituents,
      isMethodologyLocked:
        onchain.isMethodologyLocked ?? local.isMethodologyLocked,
      creator: onchain.owner,
    };
  }

  return {
    slug: onchain.slug,
    ensName: onchain.ensName,
    ticker: null,
    name: toTitle(onchain.slug),
    description: onchain.description ?? "Published onchain.",
    constituents,
    allTimeReturnPct: 0,
    dayReturnPct: 0,
    holders: 0,
    totalDepositsUsd: 0,
    isMethodologyLocked: onchain.isMethodologyLocked ?? false,
    methodologyCid: "",
    creator: onchain.owner,
    rebalancer: null,
  };
};

/**
 * Every index published under the protocol root, with the share token each one
 * settles in. Aliases resolve to the same records as their target, so they
 * arrive here as duplicate entries and are collapsed by vault address.
 */
export const fetchLiveIndexes = async (): Promise<LiveIndex[]> => {
  const indexes = await fetchOnchainIndexes();

  const entries = indexes.map(
    (onchain) =>
      ({
        slug: onchain.slug,
        ensName: onchain.ensName,
        vault: onchain.shareToken,
        fund: toFund(onchain),
      }) satisfies LiveIndex,
  );

  const byVault = new Map<string, LiveIndex>();

  for (const entry of entries) {
    if (!entry.vault) {
      continue;
    }

    const seen = byVault.get(entry.vault);
    /** Prefer the canonical slug over an alias pointed at the same vault. */
    if (!seen || (!getIndexBySlug(seen.slug) && getIndexBySlug(entry.slug))) {
      byVault.set(entry.vault, entry);
    }
  }

  return [...byVault.values()];
};
