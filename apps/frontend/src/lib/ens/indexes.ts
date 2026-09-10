import { permissionedRegistryAbi } from "./abis/PermissionedRegistry";
import { ensClient } from "./client";
import {
  ENS_DEPLOYMENT,
  getAirIndexFromBlock,
  getAirIndexRegistry,
  PROTOCOL_ROOT,
} from "./deployments";
import {
  type OnchainAgent,
  type OnchainConstituent,
  readAgent,
  readConstituent,
  readConstituentLabels,
  readIndexAddress,
  readIndexText,
  readMethodologyLock,
} from "./read";
import { isTransferable } from "./roles";

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
  name: string | null;
  description: string | null;
  resolver: `0x${string}`;
  owner: `0x${string}`;
  expiry: bigint;
  constituents: OnchainConstituent[];
  isMethodologyLocked: boolean | null;
  isVerifiedResolver: boolean;
  /** `addr(60)` on the index name itself: the share token it settles in. */
  shareToken: `0x${string}` | null;
  agent: OnchainAgent | null;
  /** False when the entry was registered without CAN_TRANSFER_ADMIN. */
  isTransferable: boolean;
}

/**
 * Labels come from the registry's own events. Wildcard constituents emit no
 * events at all, which is why the label list is published as a text record
 * rather than discovered onchain.
 */
export const listPublishedSlugs = async (): Promise<string[]> => {
  const registry = getAirIndexRegistry();

  if (!registry) {
    return [];
  }

  const logs = await ensClient.getLogs({
    address: registry,
    event: LABEL_REGISTERED_EVENT,
    fromBlock: getAirIndexFromBlock() ?? "earliest",
  });

  const slugs = logs.flatMap((log) => (log.args.label ? [log.args.label] : []));

  return [...new Set(slugs)];
};

export const fetchOnchainIndex = async (
  slug: string,
): Promise<OnchainIndex | null> => {
  const registry = getAirIndexRegistry();

  if (!registry) {
    return null;
  }

  const ensName = `${slug}.${PROTOCOL_ROOT}`;

  const [resolver, owner, expiry, tokenRoles] = await Promise.all([
    ensClient.readContract({
      address: registry,
      abi: permissionedRegistryAbi,
      functionName: "getResolver",
      args: [slug],
    }),
    ensClient.readContract({
      address: registry,
      abi: permissionedRegistryAbi,
      functionName: "findOwner",
      args: [slug],
    }),
    ensClient.readContract({
      address: registry,
      abi: permissionedRegistryAbi,
      functionName: "findExpiry",
      args: [slug],
    }),
    ensClient
      .readContract({
        address: registry,
        abi: permissionedRegistryAbi,
        functionName: "findTokenId",
        args: [slug],
      })
      .then((tokenId) =>
        ensClient.readContract({
          address: registry,
          abi: permissionedRegistryAbi,
          functionName: "roleCount",
          args: [tokenId as bigint],
        }),
      )
      .catch(() => 0n),
  ]).catch(() => [ZERO_ADDRESS, ZERO_ADDRESS, 0n, 0n] as const);

  if (resolver === ZERO_ADDRESS || owner === ZERO_ADDRESS) {
    return null;
  }

  const [
    name,
    description,
    labels,
    shareToken,
    agent,
    isMethodologyLocked,
    provenance,
  ] = await Promise.all([
    readIndexText(ensName, "name"),
    readIndexText(ensName, "description"),
    readConstituentLabels(ensName),
    readIndexAddress(ensName),
    readAgent(ensName),
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
    name,
    description,
    resolver: resolver as `0x${string}`,
    owner: owner as `0x${string}`,
    expiry: expiry as bigint,
    constituents,
    isMethodologyLocked,
    shareToken: shareToken === ZERO_ADDRESS ? null : shareToken,
    agent,
    isTransferable: isTransferable(tokenRoles as bigint),
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
