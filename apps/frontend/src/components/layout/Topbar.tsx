"use client";

import {
  BellIcon,
  EyeIcon,
  EyeSlashIcon,
  WarningIcon,
} from "@phosphor-icons/react/dist/ssr";
import { useState } from "react";
import { SITE } from "@/config/site";
import { formatUsd, truncateAddress } from "@/lib/format";
import { useWallet } from "@/lib/onchain/WalletProvider";
import { FaucetDialog } from "./FaucetDialog";

const MASKED_BALANCE = "••••••";
const PILL =
  "rounded-full border border-canvas/60 bg-surface/55 transition-colors duration-150 ease-out";

interface TopbarProps {
  totalValueUsd: number;
}

const WalletControl = () => {
  const {
    address,
    hasProvider,
    isConnecting,
    isSepolia,
    connect,
    switchNetwork,
  } = useWallet();

  if (!hasProvider) {
    return (
      <a
        href="https://metamask.io/download"
        target="_blank"
        rel="noreferrer"
        className={`${PILL} px-3 py-1.5 text-sm font-medium text-ink-muted hover:text-ink`}
      >
        Install a wallet
      </a>
    );
  }

  if (!address) {
    return (
      <button
        type="button"
        onClick={connect}
        disabled={isConnecting}
        className="rounded-full bg-accent px-4 py-1.5 text-sm font-medium text-ink-inverse transition-colors duration-150 ease-out hover:bg-accent-hover disabled:opacity-60"
      >
        {isConnecting ? "Connecting…" : "Connect wallet"}
      </button>
    );
  }

  if (!isSepolia) {
    return (
      <button
        type="button"
        onClick={switchNetwork}
        className={`${PILL} flex items-center gap-2 py-1.5 pr-3 pl-2.5 text-sm font-medium text-ink hover:bg-surface/80`}
      >
        <WarningIcon size={14} weight="fill" className="text-negative" />
        Switch to {SITE.network}
      </button>
    );
  }

  return (
    <p className={`${PILL} flex items-center gap-2 py-1.5 pr-3 pl-1.5`}>
      <span className="size-6 rounded-full bg-accent" aria-hidden />
      <span className="text-sm font-medium text-ink">
        {truncateAddress(address)}
      </span>
      <span className="rounded-full bg-canvas/65 px-1.5 py-0.5 text-[10px] font-medium text-ink-muted">
        {SITE.network}
      </span>
    </p>
  );
};

export const Topbar = ({ totalValueUsd }: TopbarProps) => {
  const [isBalanceVisible, setIsBalanceVisible] = useState(true);

  const BalanceIcon = isBalanceVisible ? EyeIcon : EyeSlashIcon;

  return (
    <header className="flex h-16 items-center gap-4 px-4 lg:px-8">
      <div className="ml-auto flex items-center gap-2">
        <p className={`${PILL} hidden items-center gap-2 px-3 py-1.5 sm:flex`}>
          <span className="text-xs text-ink-subtle">Total</span>
          <span className="text-sm font-semibold tabular-nums text-ink">
            {isBalanceVisible ? formatUsd(totalValueUsd) : MASKED_BALANCE}
          </span>
        </p>

        <button
          type="button"
          onClick={() => setIsBalanceVisible((visible) => !visible)}
          aria-pressed={!isBalanceVisible}
          className={`${PILL} p-2 text-ink-muted hover:text-ink`}
        >
          <BalanceIcon size={16} aria-hidden />
          <span className="sr-only">
            {isBalanceVisible ? "Hide portfolio value" : "Show portfolio value"}
          </span>
        </button>

        <FaucetDialog />

        <button
          type="button"
          className={`${PILL} p-2 text-ink-muted hover:text-ink`}
        >
          <BellIcon size={16} aria-hidden />
          <span className="sr-only">Notifications</span>
        </button>

        <WalletControl />
      </div>
    </header>
  );
};
