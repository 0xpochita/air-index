"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  type Account,
  type Chain,
  createWalletClient,
  custom,
  type Transport,
  type WalletClient,
} from "viem";
import { sepolia } from "viem/chains";
import {
  type Eip1193Provider,
  getInjectedProvider,
  requestSepolia,
  SEPOLIA_CHAIN_ID,
} from "./provider";

interface WalletContextValue {
  address: `0x${string}` | null;
  chainId: number | null;
  isSepolia: boolean;
  isConnecting: boolean;
  hasProvider: boolean;
  error: string | null;
  /** Bumped after every write so balance hooks know to read again. */
  epoch: number;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  switchNetwork: () => Promise<void>;
  refresh: () => void;
  getWalletClient: () => WalletClient<Transport, Chain, Account>;
}

const WalletContext = createContext<WalletContextValue | null>(null);

const toMessage = (error: unknown): string =>
  error instanceof Error ? error.message : "Wallet request failed";

/**
 * EIP-1193 has no disconnect. A wallet the user approved keeps answering
 * `eth_accounts` forever, so "disconnected" has to be remembered here or the
 * next page load silently reconnects them.
 */
const DISCONNECTED_KEY = "airindex.wallet.disconnected";

const isOptedOut = (): boolean => {
  try {
    return globalThis.localStorage?.getItem(DISCONNECTED_KEY) === "1";
  } catch {
    return false;
  }
};

const setOptedOut = (value: boolean) => {
  try {
    if (value) {
      globalThis.localStorage?.setItem(DISCONNECTED_KEY, "1");
    } else {
      globalThis.localStorage?.removeItem(DISCONNECTED_KEY);
    }
  } catch {
    return;
  }
};

export const WalletProvider = ({ children }: { children: ReactNode }) => {
  const [address, setAddress] = useState<`0x${string}` | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [hasProvider, setHasProvider] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [epoch, setEpoch] = useState(0);

  const refresh = useCallback(() => setEpoch((value) => value + 1), []);

  const readChainId = useCallback(async (provider: Eip1193Provider) => {
    const hex = (await provider.request({ method: "eth_chainId" })) as string;
    setChainId(Number.parseInt(hex, 16));
  }, []);

  /**
   * `eth_accounts` never prompts, so a wallet the user already approved is
   * restored on load while a first time visitor sees no popup.
   */
  useEffect(() => {
    const provider = getInjectedProvider();
    if (!provider) {
      return;
    }

    setHasProvider(true);

    const syncAccounts = (accounts: readonly string[]) => {
      setAddress((accounts[0] as `0x${string}`) ?? null);
    };

    if (!isOptedOut()) {
      provider
        .request({ method: "eth_accounts" })
        .then((accounts) => syncAccounts(accounts as string[]))
        .catch(() => undefined);
    }
    readChainId(provider).catch(() => undefined);

    const onAccountsChanged = (accounts: never) => {
      syncAccounts(accounts as readonly string[]);
      refresh();
    };
    const onChainChanged = (hex: never) => {
      setChainId(Number.parseInt(hex as string, 16));
      refresh();
    };

    provider.on?.("accountsChanged", onAccountsChanged);
    provider.on?.("chainChanged", onChainChanged);

    return () => {
      provider.removeListener?.("accountsChanged", onAccountsChanged);
      provider.removeListener?.("chainChanged", onChainChanged);
    };
  }, [readChainId, refresh]);

  const connect = useCallback(async () => {
    const provider = getInjectedProvider();

    if (!provider) {
      setError("No Ethereum wallet found. Install MetaMask to continue.");
      return;
    }

    setIsConnecting(true);
    setError(null);
    setOptedOut(false);

    try {
      const accounts = (await provider.request({
        method: "eth_requestAccounts",
      })) as string[];
      setAddress((accounts[0] as `0x${string}`) ?? null);
      await readChainId(provider);
    } catch (cause) {
      setError(toMessage(cause));
    } finally {
      setIsConnecting(false);
    }
  }, [readChainId]);

  /**
   * Revoking the permission is best effort: only some wallets implement it, and
   * the ones that do will prompt again on the next connect, which is what
   * "disconnect" should mean. The local opt out is what actually holds.
   */
  const disconnect = useCallback(async () => {
    setOptedOut(true);
    setAddress(null);
    setError(null);
    refresh();

    await getInjectedProvider()
      ?.request({
        method: "wallet_revokePermissions",
        params: [{ eth_accounts: {} }],
      })
      .catch(() => undefined);
  }, [refresh]);

  const switchNetwork = useCallback(async () => {
    const provider = getInjectedProvider();
    if (!provider) {
      return;
    }

    setError(null);

    try {
      await requestSepolia(provider);
      await readChainId(provider);
    } catch (cause) {
      setError(toMessage(cause));
    }
  }, [readChainId]);

  const getWalletClient = useCallback(() => {
    const provider = getInjectedProvider();

    if (!provider) {
      throw new Error("No Ethereum wallet found.");
    }

    if (!address) {
      throw new Error("Connect a wallet first.");
    }

    return createWalletClient({
      account: address,
      chain: sepolia,
      transport: custom(provider),
    });
  }, [address]);

  const value = useMemo<WalletContextValue>(
    () => ({
      address,
      chainId,
      isSepolia: chainId === SEPOLIA_CHAIN_ID,
      isConnecting,
      hasProvider,
      error,
      epoch,
      connect,
      disconnect,
      switchNetwork,
      refresh,
      getWalletClient,
    }),
    [
      address,
      chainId,
      isConnecting,
      hasProvider,
      error,
      epoch,
      connect,
      disconnect,
      switchNetwork,
      refresh,
      getWalletClient,
    ],
  );

  return (
    <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
  );
};

export const useWallet = (): WalletContextValue => {
  const value = useContext(WalletContext);

  if (!value) {
    throw new Error("useWallet must be used inside a WalletProvider");
  }

  return value;
};
