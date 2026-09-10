import { sepolia } from "viem/chains";

export interface Eip1193Provider {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on?: (event: string, handler: (payload: never) => void) => void;
  removeListener?: (event: string, handler: (payload: never) => void) => void;
}

export const SEPOLIA_CHAIN_ID = sepolia.id;

/**
 * The injected wallet, or undefined. No connector library: one EIP-1193
 * provider is the whole requirement, and a dependency that wraps it would be
 * larger than the code it replaces.
 */
export const getInjectedProvider = (): Eip1193Provider | undefined =>
  (globalThis as { ethereum?: Eip1193Provider }).ethereum;

const toHexChainId = (id: number): `0x${string}` => `0x${id.toString(16)}`;

const CHAIN_NOT_ADDED = 4902;

/** Asks the wallet to move to Sepolia, adding the network if it does not know it. */
export const requestSepolia = async (provider: Eip1193Provider) => {
  try {
    await provider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: toHexChainId(SEPOLIA_CHAIN_ID) }],
    });
  } catch (error) {
    if ((error as { code?: number }).code !== CHAIN_NOT_ADDED) {
      throw error;
    }

    await provider.request({
      method: "wallet_addEthereumChain",
      params: [
        {
          chainId: toHexChainId(SEPOLIA_CHAIN_ID),
          chainName: sepolia.name,
          nativeCurrency: sepolia.nativeCurrency,
          rpcUrls: [sepolia.rpcUrls.default.http[0]],
          blockExplorerUrls: [sepolia.blockExplorers.default.url],
        },
      ],
    });
  }
};
