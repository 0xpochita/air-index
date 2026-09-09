import { permissionedRegistryAbi } from "./abis/PermissionedRegistry";
import { ensClient } from "./client";
import {
  AIR_INDEX_FROM_BLOCK,
  AIR_INDEX_REGISTRY,
  ENS_DEPLOYMENT,
  PROTOCOL_ROOT,
} from "./deployments";
import {
  type OnchainConstituent,
  readConstituent,
  readConstituentLabels,
  readIndexText,
  readMethodologyLock,
} from "./read";

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

const LABEL_REGISTERED_EVENT = {
  type: "event",
  name: "LabelRegistered",
  inputs: [
    { name: "tokenId", type: "uint256", indexed: true },
    { name: "labelHash", type: "bytes32", indexed: true },
    { name: "label", type: "string", indexed: false },
    { name: "owner", type: "address", indexed: false },
    { name: "expiry", type: "uint64", indexed: false },
    { name: "sender", type: "address", indexed: true },
  ],
} as const;

export interface OnchainIndex {
  slug: string;
  ensName: string;
  description: string | null;
  resolver: `0x${string}`;
  owner: `0x${string}`;
  expiry: bigint;
  constituents: OnchainConstituent[];
  isMethodologyLocked: boolean | null;
  isVerifiedResolver: boolean;
}

/**
 * Labels come from the registry's own events. Wildcard constituents emit no
 * events at all, which is why the label list is published as a text record
 * rather than discovered onchain.
 */
export const listPublishedSlugs = async (): Promise<string[]> => {
  if (!AIR_INDEX_REGISTRY) {
    return [];
  }

  const logs = await ensClient.getLogs({
    address: AIR_INDEX_REGISTRY,
    event: LABEL_REGISTERED_EVENT,
    fromBlock: AIR_INDEX_FROM_BLOCK ?? "earliest",
  });

  const slugs = logs.flatMap((log) => (log.args.label ? [log.args.label] : []));

  return [...new Set(slugs)];
};

export const fetchOnchainIndex = async (
  slug: string,
): Promise<OnchainIndex | null> => {
  if (!AIR_INDEX_REGISTRY) {
    return null;
  }

  const ensName = `${slug}.${PROTOCOL_ROOT}`;

  const [resolver, owner, expiry] = await Promise.all([
    ensClient.readContract({
      address: AIR_INDEX_REGISTRY,
      abi: permissionedRegistryAbi,
      functionName: "getResolver",
      args: [slug],
    }),
    ensClient.readContract({
      address: AIR_INDEX_REGISTRY,
      abi: permissionedRegistryAbi,
      functionName: "findOwner",
      args: [slug],
    }),
    ensClient.readContract({
      address: AIR_INDEX_REGISTRY,
      abi: permissionedRegistryAbi,
      functionName: "findExpiry",
      args: [slug],
    }),
  ]).catch(() => [ZERO_ADDRESS, ZERO_ADDRESS, 0n] as const);

  if (resolver === ZERO_ADDRESS || owner === ZERO_ADDRESS) {
    return null;
  }

  const [description, labels, isMethodologyLocked, provenance] =
    await Promise.all([
      readIndexText(ensName, "description"),
      readConstituentLabels(ensName),
      readMethodologyLock(resolver as `0x${string}`),
      ensClient
        .readContract({
          address: ENS_DEPLOYMENT.verifiableFactory,
          abi: [
            {
              type: "function",
              name: "verifyContract",
              stateMutability: "view",
              inputs: [{ name: "proxy", type: "address" }],
              outputs: [{ name: "implementation", type: "address" }],
            },
          ] as const,
          functionName: "verifyContract",
          args: [resolver as `0x${string}`],
        })
        .catch(() => ZERO_ADDRESS),
    ]);

  const constituents = await Promise.all(
    labels.map((symbol) => readConstituent(symbol, ensName)),
  );

  return {
    slug,
    ensName,
    description,
    resolver: resolver as `0x${string}`,
    owner: owner as `0x${string}`,
    expiry: expiry as bigint,
    constituents,
    isMethodologyLocked,
    isVerifiedResolver:
      provenance.toLowerCase() ===
      ENS_DEPLOYMENT.permissionedResolverImpl.toLowerCase(),
  };
};

export const fetchOnchainIndexes = async (): Promise<OnchainIndex[]> => {
  const slugs = await listPublishedSlugs();
  const indexes = await Promise.all(
    slugs.map((slug) => fetchOnchainIndex(slug)),
  );
  return indexes.filter((index): index is OnchainIndex => index !== null);
};
