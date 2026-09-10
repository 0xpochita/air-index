"use client";

import { DropIcon, XIcon } from "@phosphor-icons/react/dist/ssr";
import { useCallback, useEffect, useRef, useState } from "react";
import { erc20Abi } from "viem";
import { TokenIcon } from "@/components/ui/TokenIcon";
import { TxSuccessDialog } from "@/components/ui/TxSuccessDialog";
import { ensClient } from "@/lib/ens/client";
import { formatAmount } from "@/lib/format";
import { toFloat } from "@/lib/onchain/PortfolioProvider";
import { useVaultActions } from "@/lib/onchain/useVaultActions";
import { useWallet } from "@/lib/onchain/WalletProvider";
import { isDeployed, TOKENS } from "@/lib/tokens/registry";
import {
  TOKEN_SYMBOLS,
  type Token,
  type TokenSymbol,
} from "@/types/index-fund";

/** Only symbols with a real Sepolia deployment can be minted. */
const FAUCET_TOKENS = TOKEN_SYMBOLS.map((symbol) => TOKENS[symbol]).filter(
  isDeployed,
);

interface FaucetDialogProps {
  /** The trigger sits on the dark bar, so its styling comes from the caller. */
  triggerClassName: string;
}

export const FaucetDialog = ({ triggerClassName }: FaucetDialogProps) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const { address, isSepolia, epoch, connect } = useWallet();
  const { faucet, pending, error, last, dismiss } = useVaultActions();
  const [minted, setMinted] = useState<Token | null>(null);
  const [balances, setBalances] = useState<
    Partial<Record<TokenSymbol, bigint>>
  >({});
  const [isOpen, setIsOpen] = useState(false);

  const readBalances = useCallback(async () => {
    if (!address) {
      setBalances({});
      return;
    }

    const results = await ensClient
      .multicall({
        contracts: FAUCET_TOKENS.map((token) => ({
          address: token.address,
          abi: erc20Abi,
          functionName: "balanceOf" as const,
          args: [address] as const,
        })),
        allowFailure: true,
      })
      .catch(() => []);

    setBalances(
      Object.fromEntries(
        FAUCET_TOKENS.map((token, position) => {
          const entry = results[position];
          return [
            token.symbol,
            entry?.status === "success" ? (entry.result as bigint) : 0n,
          ];
        }),
      ),
    );
  }, [address]);

  /** Reads only while the dialog is open, and again after every mint. */
  // biome-ignore lint/correctness/useExhaustiveDependencies: epoch is the refetch trigger a mint bumps, not a value this effect reads
  useEffect(() => {
    if (!isOpen) {
      return;
    }
    readBalances();
  }, [isOpen, readBalances, epoch]);

  const open = () => {
    setIsOpen(true);
    dialogRef.current?.showModal();
  };

  const close = () => {
    setIsOpen(false);
    dialogRef.current?.close();
  };

  return (
    <>
      <button
        type="button"
        onClick={open}
        title="Mint test tokens"
        className={triggerClassName}
      >
        <DropIcon size={16} aria-hidden />
        <span className="sr-only">Mint test tokens</span>
      </button>

      <dialog
        ref={dialogRef}
        onClose={() => setIsOpen(false)}
        aria-labelledby="faucet-title"
        className="m-auto w-[calc(100%-2rem)] max-w-md rounded-xl border border-line bg-surface p-0 text-ink shadow-floating backdrop:bg-ink/40"
      >
        <div className="flex items-center justify-between gap-4 border-b border-line px-5 py-4">
          <div>
            <h2 id="faucet-title" className="text-sm font-semibold text-ink">
              Testnet faucet
            </h2>
            <p className="mt-0.5 text-xs text-ink-subtle">
              1,000 units per claim. These are mock ERC20s on Sepolia.
            </p>
          </div>
          <button
            type="button"
            onClick={close}
            className="rounded-md p-1 text-ink-subtle transition-colors duration-150 ease-out hover:bg-surface-hover hover:text-ink"
          >
            <XIcon size={16} aria-hidden />
            <span className="sr-only">Close</span>
          </button>
        </div>

        {address && isSepolia ? (
          <ul className="max-h-96 overflow-y-auto px-3 py-3">
            {FAUCET_TOKENS.map((token) => (
              <li key={token.symbol}>
                <div className="flex items-center gap-3 rounded-md px-2 py-2">
                  <TokenIcon token={token} size="md" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-ink">
                      {`m${token.symbol.toUpperCase()}`}
                    </span>
                    <span className="block truncate text-xs text-ink-subtle">
                      {token.name}
                    </span>
                  </span>
                  <span className="shrink-0 text-sm tabular-nums text-ink-muted">
                    {formatAmount(
                      toFloat(balances[token.symbol] ?? 0n, token.decimals),
                    )}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setMinted(token);
                      faucet(token.address);
                    }}
                    disabled={pending !== null}
                    className="shrink-0 rounded-full bg-accent px-3 py-1.5 text-xs font-medium text-ink-inverse transition-colors duration-150 ease-out hover:bg-accent-hover disabled:opacity-50"
                  >
                    Mint
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="space-y-3 px-5 py-6">
            <p className="text-sm text-ink-muted">
              Connect a wallet on Sepolia to mint test tokens.
            </p>
            <button
              type="button"
              onClick={connect}
              className="rounded-full bg-accent px-4 py-1.5 text-sm font-medium text-ink-inverse transition-colors duration-150 ease-out hover:bg-accent-hover"
            >
              Connect wallet
            </button>
          </div>
        )}

        {error ? (
          <p className="border-t border-line px-5 py-3 text-xs text-negative">
            {error}
          </p>
        ) : null}
      </dialog>

      <TxSuccessDialog
        hash={last?.hash ?? null}
        title="Test tokens minted"
        icon={minted ? <TokenIcon token={minted} size="lg" /> : null}
        detail={minted ? `1,000 m${minted.symbol.toUpperCase()}` : null}
        onDismiss={dismiss}
      />
    </>
  );
};
