import { namehash, toHex } from "viem";
import { normalize, packetToBytes } from "viem/ens";
import { PROTOCOL_ROOT } from "./deployments";

/**
 * Normalise before hashing. `getEnsText` normalises internally, so a write that
 * skipped this step would target a different node than the read.
 */
export const toEnsName = (label: string): string =>
  normalize(`${label}.${PROTOCOL_ROOT}`);

export const toConstituentName = (
  symbol: string,
  indexEnsName: string,
): string => normalize(`${symbol}.${indexEnsName}`);

export const toNode = (name: string): `0x${string}` =>
  namehash(normalize(name));

/** `authorize*` and `setAlias` take DNS-encoded names; record setters take namehashes. */
export const toDnsEncoded = (name: string): `0x${string}` =>
  toHex(packetToBytes(normalize(name)));

const SLUG_PATTERN = /[^a-z0-9-]/g;

export const toSlug = (value: string): string =>
  value.trim().toLowerCase().replace(/\s+/g, "-").replace(SLUG_PATTERN, "");
