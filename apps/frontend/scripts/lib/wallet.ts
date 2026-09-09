import {
  createPublicClient,
  createWalletClient,
  formatEther,
  http,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { sepolia } from "viem/chains";
import { loadEnv } from "./env";

const FALLBACK_RPC = "https://ethereum-sepolia-rpc.publicnode.com";
const MIN_BALANCE_WEI = 300_000_000_000_000n;

loadEnv();

const rpcUrl = process.env.SEPOLIA_RPC_URL || FALLBACK_RPC;

export const publicClient = createPublicClient({
  chain: sepolia,
  transport: http(rpcUrl),
});

/**
 * Signing client for the probe and bootstrap scripts. Lives under scripts/ so a
 * private key can never be pulled into the browser bundle by an accidental
 * import from a component.
 */
export const getWallet = () => {
  const key = process.env.DEPLOYER_PRIVATE_KEY;

  if (!key) {
    throw new Error(
      "DEPLOYER_PRIVATE_KEY is empty. Add a throwaway testnet key to apps/frontend/.env, never a real wallet.",
    );
  }

  if (!key.startsWith("0x") || key.length !== 66) {
    throw new Error(
      "DEPLOYER_PRIVATE_KEY must be a 0x-prefixed 32 byte hex string.",
    );
  }

  const account = privateKeyToAccount(key as `0x${string}`);

  return {
    account,
    client: createWalletClient({
      account,
      chain: sepolia,
      transport: http(rpcUrl),
    }),
  };
};

/** The delegated rebalancer, used to prove that record scoping actually holds. */
export const getAgentWallet = () => {
  const key = process.env.REBALANCER_PRIVATE_KEY;

  if (!key) {
    throw new Error(
      "REBALANCER_PRIVATE_KEY is empty. Generate a throwaway agent key first.",
    );
  }

  const account = privateKeyToAccount(key as `0x${string}`);

  return {
    account,
    client: createWalletClient({
      account,
      chain: sepolia,
      transport: http(rpcUrl),
    }),
  };
};

export const requireFunds = async (address: `0x${string}`) => {
  const balance = await publicClient.getBalance({ address });

  if (balance < MIN_BALANCE_WEI) {
    throw new Error(
      `${address} holds ${formatEther(balance)} SepoliaETH. Top up from a faucet before running writes.`,
    );
  }

  return balance;
};

export const logTx = async (label: string, hash: `0x${string}`) => {
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  console.log(
    `  ${label}: ${hash} (${receipt.status}, gas ${receipt.gasUsed})`,
  );
  return receipt;
};
