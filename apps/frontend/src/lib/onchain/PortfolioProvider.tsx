"use client";

import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { erc20Abi, formatUnits } from "viem";
import { ensClient } from "@/lib/ens/client";
import type { PortfolioPosition } from "@/lib/portfolio";
import {
  QUOTE_PRICE_USD,
  QUOTE_SYMBOLS,
  SETTLEMENT_SYMBOL,
} from "@/lib/settlement";
import { isDeployed, TOKENS } from "@/lib/tokens/registry";
import type { TokenSymbol } from "@/types/index-fund";
import { indexVaultAbi, SHARE_DECIMALS } from "./abis";
import type { LiveIndex } from "./vaults";
import { useWallet } from "./WalletProvider";

const SHARE_UNIT = 10n ** BigInt(SHARE_DECIMALS);

export const toFloat = (value: bigint, decimals: number): number =>
  Number(formatUnits(value, decimals));

interface PortfolioContextValue {
  liveIndexes: LiveIndex[];
  /** Share balance per slug, in the vault's own 18 decimal units. */
  shares: Record<string, bigint>;
  /** Quote units per whole share, as the vault itself reports it. */
  sharePrices: Record<string, bigint>;
  quoteBalances: Partial<Record<TokenSymbol, bigint>>;
  positions: PortfolioPosition[];
  totalValueUsd: number;
  isLoading: boolean;
}

const EMPTY: PortfolioContextValue = {
  liveIndexes: [],
  shares: {},
  sharePrices: {},
  quoteBalances: {},
  positions: [],
  totalValueUsd: 0,
  isLoading: false,
};

const PortfolioContext = createContext<PortfolioContextValue>(EMPTY);

const QUOTE_TOKENS = QUOTE_SYMBOLS.map((symbol) => TOKENS[symbol]).filter(
  isDeployed,
);

interface PortfolioProviderProps {
  liveIndexes: LiveIndex[];
  children: ReactNode;
}

export const PortfolioProvider = ({
  liveIndexes,
  children,
}: PortfolioProviderProps) => {
  const { address, epoch } = useWallet();
  const [shares, setShares] = useState<Record<string, bigint>>({});
  const [sharePrices, setSharePrices] = useState<Record<string, bigint>>({});
  const [quoteBalances, setQuoteBalances] = useState<
    Partial<Record<TokenSymbol, bigint>>
  >({});
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Flattened to a string so the effect depends on the vault list's contents
   * rather than the array identity a server render hands over fresh each time.
   */
  const vaultKey = liveIndexes
    .flatMap((entry) => (entry.vault ? [`${entry.slug}:${entry.vault}`] : []))
    .join(",");

  // biome-ignore lint/correctness/useExhaustiveDependencies: epoch is the refetch trigger a write bumps, not a value this effect reads
  useEffect(() => {
    if (!vaultKey) {
      return;
    }

    const vaults = vaultKey.split(",").map((entry) => {
      const [slug, vault] = entry.split(":");
      return { slug, vault: vault as `0x${string}` };
    });

    let cancelled = false;
    setIsLoading(true);

    /**
     * Share prices are static and readable with no wallet, so the vault list
     * renders its real NAV before anyone connects. Balances only join the batch
     * once there is an address to read them for.
     */
    const priceCalls = vaults.map((entry) => ({
      address: entry.vault,
      abi: indexVaultAbi,
      functionName: "sharePrice" as const,
    }));

    const balanceCalls = address
      ? [
          ...vaults.map((entry) => ({
            address: entry.vault,
            abi: erc20Abi,
            functionName: "balanceOf" as const,
            args: [address] as const,
          })),
          ...QUOTE_TOKENS.map((token) => ({
            address: token.address,
            abi: erc20Abi,
            functionName: "balanceOf" as const,
            args: [address] as const,
          })),
        ]
      : [];

    ensClient
      .multicall({
        contracts: [...priceCalls, ...balanceCalls],
        allowFailure: true,
      })
      .then((results) => {
        if (cancelled) {
          return;
        }

        const readAt = (offset: number): bigint => {
          const entry = results[offset];
          return entry?.status === "success" ? (entry.result as bigint) : 0n;
        };

        setSharePrices(
          Object.fromEntries(
            vaults.map((entry, position) => [entry.slug, readAt(position)]),
          ),
        );

        if (!address) {
          setShares({});
          setQuoteBalances({});
          return;
        }

        const balanceOffset = vaults.length;
        setShares(
          Object.fromEntries(
            vaults.map((entry, position) => [
              entry.slug,
              readAt(balanceOffset + position),
            ]),
          ),
        );
        setQuoteBalances(
          Object.fromEntries(
            QUOTE_TOKENS.map((token, position) => [
              token.symbol,
              readAt(balanceOffset + vaults.length + position),
            ]),
          ),
        );
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [address, epoch, vaultKey]);

  const value = useMemo<PortfolioContextValue>(() => {
    const quoteDecimals = TOKENS[SETTLEMENT_SYMBOL].decimals;

    const positions = liveIndexes.flatMap((entry) => {
      const balance = shares[entry.slug] ?? 0n;

      if (balance === 0n) {
        return [];
      }

      const quoteAmount =
        (balance * (sharePrices[entry.slug] ?? 0n)) / SHARE_UNIT;

      return [
        {
          index: entry,
          units: toFloat(balance, SHARE_DECIMALS),
          valueUsd:
            toFloat(quoteAmount, quoteDecimals) *
            QUOTE_PRICE_USD[SETTLEMENT_SYMBOL],
        } satisfies PortfolioPosition,
      ];
    });

    return {
      liveIndexes,
      shares,
      sharePrices,
      quoteBalances,
      positions,
      totalValueUsd: positions.reduce(
        (total, position) => total + position.valueUsd,
        0,
      ),
      isLoading,
    };
  }, [isLoading, liveIndexes, quoteBalances, sharePrices, shares]);

  return (
    <PortfolioContext.Provider value={value}>
      {children}
    </PortfolioContext.Provider>
  );
};

export const usePortfolio = (): PortfolioContextValue =>
  useContext(PortfolioContext);
