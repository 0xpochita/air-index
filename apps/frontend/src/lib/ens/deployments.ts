import { sepolia } from "viem/chains";

/**
 * ENSv2 Sepolia beta addresses.
 *
 * Every address was read from the ENS deployments page and then confirmed to
 * have bytecode on Sepolia. Source revision is `ensdomains/contracts-v2` at tag
 * `sepolia-deployment-2026-07-31`, which is NOT the repo default branch.
 * See `apps/agents/research/research.md` for the evidence behind each entry.
 */
export const ENS_DEPLOYMENT = {
  chain: sepolia,
  rootRegistry: "0x8115186e8f2e0b0281e86ab91f0f48ba90364354",
  ethRegistry: "0xbdc85dd5b15d7ecb354cd7cb6f2c50b4f2c4f0e2",
  ethRegistrar: "0xa88553f454b77203b0d036a05c894d555eaaa2cc",
  universalResolver: "0xeEeEEEeE14D718C2B47D9923Deab1335E144EeEe",
  universalResolverV2: "0x4a1817d13e9cf196f471725176355c1234b63c70",
  verifiableFactory: "0x10dc6333cdfe1fcef624c6e0a8221b91804cd7ef",
  permissionedResolverImpl: "0x9eae5c2730a7dd16bdd1dee6421a1b91e3b0365e",
  userRegistryImpl: "0x624a25d67b59d587752ebec8dded8827dae52050",
  mockUsdc: "0x768f42455a2d082e23ceef7d51e5787c82d67a39",
} as const satisfies Record<string, unknown>;

export const ENS_RPC_URL =
  process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL ??
  "https://ethereum-sepolia-rpc.publicnode.com";

export const PROTOCOL_ROOT = "airindex.eth";

export const AIR_INDEX_REGISTRY = process.env.NEXT_PUBLIC_AIR_INDEX_REGISTRY as
  | `0x${string}`
  | undefined;
