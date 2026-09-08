"use client";

import {
  BellIcon,
  EyeIcon,
  EyeSlashIcon,
} from "@phosphor-icons/react/dist/ssr";
import { useState } from "react";
import { CONNECTED_ACCOUNT, SITE } from "@/config/site";
import { formatUsd, truncateAddress } from "@/lib/format";

const MASKED_BALANCE = "••••••";

interface TopbarProps {
  totalValueUsd: number;
}

export const Topbar = ({ totalValueUsd }: TopbarProps) => {
  const [isBalanceVisible, setIsBalanceVisible] = useState(true);

  const BalanceIcon = isBalanceVisible ? EyeIcon : EyeSlashIcon;

  return (
    <header className="flex h-16 items-center gap-4 px-4 lg:px-8">
      <div className="ml-auto flex items-center gap-2">
        <p className="hidden items-center gap-2 rounded-full border border-canvas/60 bg-surface/55 px-3 py-1.5 sm:flex">
          <span className="text-xs text-ink-subtle">Total</span>
          <span className="text-sm font-semibold tabular-nums text-ink">
            {isBalanceVisible ? formatUsd(totalValueUsd) : MASKED_BALANCE}
          </span>
        </p>

        <button
          type="button"
          onClick={() => setIsBalanceVisible((visible) => !visible)}
          aria-pressed={!isBalanceVisible}
          className="rounded-full border border-canvas/60 bg-surface/55 p-2 text-ink-muted transition-colors duration-150 ease-out hover:text-ink"
        >
          <BalanceIcon size={16} aria-hidden />
          <span className="sr-only">
            {isBalanceVisible ? "Hide portfolio value" : "Show portfolio value"}
          </span>
        </button>

        <button
          type="button"
          className="rounded-full border border-canvas/60 bg-surface/55 p-2 text-ink-muted transition-colors duration-150 ease-out hover:text-ink"
        >
          <BellIcon size={16} aria-hidden />
          <span className="sr-only">Notifications</span>
        </button>

        <p className="flex items-center gap-2 rounded-full border border-canvas/60 bg-surface/55 py-1.5 pr-3 pl-1.5">
          <span className="size-6 rounded-full bg-accent" aria-hidden />
          <span className="text-sm font-medium text-ink">
            {truncateAddress(CONNECTED_ACCOUNT)}
          </span>
          <span className="rounded-full bg-canvas/65 px-1.5 py-0.5 text-[10px] font-medium text-ink-muted">
            {SITE.network}
          </span>
        </p>
      </div>
    </header>
  );
};
