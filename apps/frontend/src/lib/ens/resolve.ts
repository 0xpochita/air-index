import { namehash } from "viem";
import { normalize } from "viem/ens";
import { permissionedRegistryAbi } from "./abis/PermissionedRegistry";
import { universalResolverV2Abi } from "./abis/UniversalResolverV2";
import { ensClient } from "./client";
import {
  ENS_DEPLOYMENT,
  getAirIndexRegistry,
  PROTOCOL_ROOT,
} from "./deployments";
import { toDnsEncoded } from "./name";

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

/**
 * The keys worth showing for an arbitrary name. There is no way to enumerate
 * text records onchain — a resolver answers for any key and stores nothing it
 * was not given — so a lookup can only ever ask for keys it already knows.
 */
const TEXT_KEYS = [
  "name",
  "description",
  "constituents",
  "weight",
  "mandate",
  "delegated-key",
  "url",
  "avatar",
] as const;

export interface ResolvedRecord {
  key: string;
  value: string;
}

export interface ResolvedName {
  name: string;
  namehash: `0x${string}`;
  dnsEncoded: `0x${string}`;
  address: `0x${string}` | null;
  records: ResolvedRecord[];
  /** The resolver the Universal Resolver walked to, or null if nothing answers. */
  resolver: `0x${string}` | null;
  /**
   * Why the name resolves. A name one level under the root has a registry
   * entry; anything deeper cannot have one, because the entry above it lends
   * no subregistry to hold it.
   */
  registration:
    | { kind: "entry"; label: string; owner: `0x${string}` }
    | { kind: "wildcard"; label: string; parent: string }
    | { kind: "unregistered"; label: string }
    | null;
}

export class ResolveError extends Error {}

/**
 * Answers the only question that matters about a name under this root: does it
 * have a registry entry, or is a resolver above it answering on its behalf?
 *
 * Depth decides. `big-five.airindex.eth` is an entry in the Air Index registry.
 * `btc.big-five.airindex.eth` cannot be one — `big-five` was registered with no
 * subregistry, so there is nowhere for `btc` to live. It resolves anyway.
 */
const describeRegistration = async (
  name: string,
): Promise<ResolvedName["registration"]> => {
  const registry = getAirIndexRegistry();
  const suffix = `.${PROTOCOL_ROOT}`;

  if (!registry || !name.endsWith(suffix)) {
    return null;
  }

  const labels = name.slice(0, -suffix.length).split(".");
  const root = labels[labels.length - 1];
  const leaf = labels[0];

  const read = (fn: "findOwner" | "getSubregistry", label: string) =>
    ensClient
      .readContract({
        address: registry,
        abi: permissionedRegistryAbi,
        functionName: fn,
        args: [label],
      })
      .then((value) => value as `0x${string}`)
      .catch(() => ZERO_ADDRESS as `0x${string}`);

  if (labels.length === 1) {
    const owner = await read("findOwner", root);
    return owner === ZERO_ADDRESS
      ? { kind: "unregistered", label: root }
      : { kind: "entry", label: root, owner };
  }

  const subregistry = await read("getSubregistry", root);

  return subregistry === ZERO_ADDRESS
    ? { kind: "wildcard", label: leaf, parent: `${root}${suffix}` }
    : { kind: "unregistered", label: leaf };
};

export const resolveName = async (input: string): Promise<ResolvedName> => {
  let name: string;

  try {
    name = normalize(input.trim());
  } catch {
    throw new ResolveError("That is not a valid ENS name.");
  }

  if (!name.includes(".")) {
    throw new ResolveError("Enter a full name, including the suffix.");
  }

  const dnsEncoded = toDnsEncoded(name);

  const resolver = await ensClient
    .readContract({
      address: ENS_DEPLOYMENT.universalResolverV2,
      abi: universalResolverV2Abi,
      functionName: "findResolver",
      args: [dnsEncoded],
    })
    .then((result) => (result as [`0x${string}`, `0x${string}`, bigint])[0])
    .catch(() => null);

  const [address, ...values] = await Promise.all([
    ensClient.getEnsAddress({ name }).catch(() => null),
    ...TEXT_KEYS.map((key) =>
      ensClient.getEnsText({ name, key }).catch(() => null),
    ),
  ]);

  const records = TEXT_KEYS.flatMap((key, index) => {
    const value = values[index];
    return value ? [{ key, value }] : [];
  });

  const registration = await describeRegistration(name);

  return {
    name,
    namehash: namehash(name),
    dnsEncoded,
    address: address && address !== ZERO_ADDRESS ? address : null,
    records,
    resolver:
      resolver && resolver !== ZERO_ADDRESS
        ? (resolver as `0x${string}`)
        : null,
    registration,
  };
};
