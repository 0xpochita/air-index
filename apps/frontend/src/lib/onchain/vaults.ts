import { toDisplayConstituents } from "@/lib/ens/constituents";
import { fetchOnchainIndexes, type OnchainIndex } from "@/lib/ens/indexes";
import type { OnchainAgent } from "@/lib/ens/read";
import type { Constituent } from "@/types/index-fund";

/**
 * An index as the chain describes it, flattened for rendering. Nothing here is
 * supplied by this app: every field is a record, a role or a registry entry.
 *
 * `expiresAt` is seconds rather than a bigint because this crosses the server
 * to client boundary, and a bigint does not survive that reliably.
 */
export interface LiveIndex {
  slug: string;
  ensName: string;
  name: string;
  description: string | null;
  constituents: Constituent[];
  /** The share token, read from `addr(60)` on the index name itself. */
  vault: `0x${string}` | null;
  resolver: `0x${string}`;
  owner: `0x${string}`;
  agent: OnchainAgent | null;
  isMethodologyLocked: boolean;
  isTransferable: boolean;
  isVerifiedResolver: boolean;
  expiresAt: number;
}

/** Indexes published before `text("name")` existed fall back to their label. */
const toTitle = (slug: string): string =>
  slug
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

export const toLiveIndex = (onchain: OnchainIndex): LiveIndex => ({
  slug: onchain.slug,
  ensName: onchain.ensName,
  name: onchain.name ?? toTitle(onchain.slug),
  description: onchain.description,
  constituents: toDisplayConstituents(onchain.constituents),
  vault: onchain.shareToken,
  resolver: onchain.resolver,
  owner: onchain.owner,
  agent: onchain.agent,
  isMethodologyLocked: onchain.isMethodologyLocked ?? false,
  isTransferable: onchain.isTransferable,
  isVerifiedResolver: onchain.isVerifiedResolver,
  expiresAt: Number(onchain.expiry),
});

/**
 * Every index published under the protocol root. Aliases resolve to the same
 * records as their target, so they arrive here as duplicates and are collapsed
 * by resolver — the canonical slug wins by arriving first.
 */
export const fetchLiveIndexes = async (): Promise<LiveIndex[]> => {
  const indexes = await fetchOnchainIndexes();
  const byResolver = new Map<string, LiveIndex>();

  for (const onchain of indexes) {
    if (!byResolver.has(onchain.resolver)) {
      byResolver.set(onchain.resolver, toLiveIndex(onchain));
    }
  }

  return [...byResolver.values()];
};
