import { permissionedResolverAbi } from "./abis/PermissionedResolver";
import { verifiableFactoryAbi } from "./abis/VerifiableFactory";
import { ensClient } from "./client";
import { ENS_DEPLOYMENT } from "./deployments";
import { toConstituentName } from "./name";
import { isMethodologyLocked } from "./roles";

const CONSTITUENTS_KEY = "constituents";
const WEIGHT_KEY = "weight";
const ROOT_RESOURCE = 0n;

export interface OnchainConstituent {
  symbol: string;
  ensName: string;
  address: `0x${string}` | null;
  weightBps: number | null;
}

/**
 * Read a record through the Universal Resolver. Aliases are only applied inside
 * `resolve()`, and wildcard subnames are only reachable through it, so a direct
 * resolver call would return empty with no error on both paths.
 */
export const readIndexText = async (
  name: string,
  key: string,
): Promise<string | null> =>
  ensClient.getEnsText({ name, key }).catch(() => null);

export const readIndexAddress = async (
  name: string,
): Promise<`0x${string}` | null> =>
  ensClient.getEnsAddress({ name }).catch(() => null);

/**
 * Wildcard constituents emit no registry events, so the label list cannot be
 * enumerated onchain. It is published as a text record on the index itself.
 */
export const readConstituentLabels = async (
  indexEnsName: string,
): Promise<string[]> => {
  const raw = await readIndexText(indexEnsName, CONSTITUENTS_KEY);
  if (!raw) {
    return [];
  }
  return raw
    .split(",")
    .map((label) => label.trim())
    .filter(Boolean);
};

export const readConstituent = async (
  symbol: string,
  indexEnsName: string,
): Promise<OnchainConstituent> => {
  const ensName = toConstituentName(symbol, indexEnsName);
  const [address, weight] = await Promise.all([
    readIndexAddress(ensName),
    readIndexText(ensName, WEIGHT_KEY),
  ]);
  const weightBps = weight === null ? null : Number.parseInt(weight, 10);

  return {
    symbol,
    ensName,
    address,
    weightBps: Number.isFinite(weightBps) ? weightBps : null,
  };
};

export const readConstituents = async (
  indexEnsName: string,
): Promise<OnchainConstituent[]> => {
  const labels = await readConstituentLabels(indexEnsName);
  return Promise.all(
    labels.map((symbol) => readConstituent(symbol, indexEnsName)),
  );
};

/**
 * Proof that the methodology cannot be rewritten, read straight from the
 * resolver's own access control rather than asserted by this app.
 */
export const readMethodologyLock = async (
  resolverAddress: `0x${string}`,
): Promise<boolean | null> =>
  ensClient
    .readContract({
      address: resolverAddress,
      abi: permissionedResolverAbi,
      functionName: "roleCount",
      args: [ROOT_RESOURCE],
    })
    .then((counts) => isMethodologyLocked(counts))
    .catch(() => null);

/** Returns the implementation a proxy was deployed from, or null if unverifiable. */
export const readResolverProvenance = async (
  resolverAddress: `0x${string}`,
): Promise<`0x${string}` | null> =>
  ensClient
    .readContract({
      address: ENS_DEPLOYMENT.verifiableFactory,
      abi: verifiableFactoryAbi,
      functionName: "verifyContract",
      args: [resolverAddress],
    })
    .catch(() => null);
