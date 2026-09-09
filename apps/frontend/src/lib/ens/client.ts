import { createPublicClient, http } from "viem";
import { ENS_DEPLOYMENT, ENS_RPC_URL } from "./deployments";

/**
 * Sepolia's built-in `ensUniversalResolver` already points at the upgradable
 * proxy that serves UniversalResolverV2, so ENSv2 names resolve with no
 * override. That is the claim the product rests on, so it is left unconfigured
 * on purpose.
 */
export const ensClient = createPublicClient({
  chain: ENS_DEPLOYMENT.chain,
  transport: http(ENS_RPC_URL),
});
