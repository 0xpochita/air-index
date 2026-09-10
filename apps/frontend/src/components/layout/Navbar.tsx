"use client";

import {
  EyeIcon,
  EyeSlashIcon,
  SignOutIcon,
  WarningIcon,
} from "@phosphor-icons/react/dist/ssr";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { PRIMARY_NAV } from "@/config/navigation";
import { SITE } from "@/config/site";
import { cn } from "@/lib/cn";
import { formatUsd, truncateAddress } from "@/lib/format";
import { useWallet } from "@/lib/onchain/WalletProvider";
import { FaucetDialog } from "./FaucetDialog";

const MASKED_BALANCE = "••••••";

const BAR_ICON =
  "rounded-full p-2 text-ink-muted transition-colors duration-150 ease-out hover:bg-surface-hover hover:text-ink";

const WalletControl = () => {
  const {
    address,
    hasProvider,
    isConnecting,
    isSepolia,
    connect,
    disconnect,
    switchNetwork,
  } = useWallet();

  if (!hasProvider) {
    return (
      <a
        href="https://metamask.io/download"
        target="_blank"
        rel="noreferrer"
        className="rounded-full bg-accent px-4 py-2 text-sm font-medium text-ink-inverse transition-colors duration-150 ease-out hover:bg-accent-hover"
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
        className="rounded-full bg-accent px-4 py-2 text-sm font-medium text-ink-inverse transition-colors duration-150 ease-out hover:bg-accent-hover disabled:opacity-60"
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
        className="flex items-center gap-2 rounded-full bg-negative px-4 py-2 text-sm font-medium text-ink-inverse transition-opacity duration-150 ease-out hover:opacity-90"
      >
        <WarningIcon size={14} weight="fill" aria-hidden />
        Switch to {SITE.network}
      </button>
    );
  }

  return (
    <span className="flex items-center gap-1 rounded-full border border-line bg-surface-subtle py-1 pr-1 pl-1.5">
      <span className="size-6 rounded-full bg-accent" aria-hidden />
      <span className="text-sm font-medium text-ink">
        {truncateAddress(address)}
      </span>
      <span className="hidden rounded-full bg-surface-hover px-1.5 py-0.5 text-[10px] font-medium text-ink-muted sm:block">
        {SITE.network}
      </span>
      <button
        type="button"
        onClick={disconnect}
        title="Disconnect wallet"
        className="rounded-full p-1.5 text-ink-subtle transition-colors duration-150 ease-out hover:bg-surface-hover hover:text-negative"
      >
        <SignOutIcon size={14} weight="bold" aria-hidden />
        <span className="sr-only">Disconnect wallet</span>
      </button>
    </span>
  );
};

interface NavbarProps {
  totalValueUsd: number;
}

export const Navbar = ({ totalValueUsd }: NavbarProps) => {
  const pathname = usePathname();
  const [isBalanceVisible, setIsBalanceVisible] = useState(true);

  const BalanceIcon = isBalanceVisible ? EyeIcon : EyeSlashIcon;
  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header className="sticky top-0 z-40 px-4 pt-4 pb-2 lg:px-8">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-2 rounded-full border border-canvas/60 bg-surface/72 px-2 shadow-glass backdrop-blur-xl">
        <Link
          href="/explore"
          className="flex shrink-0 items-center gap-2 rounded-full pr-2 pl-1"
        >
          <Image
            src="/assets/logo-airindex.png"
            alt=""
            width={28}
            height={28}
            priority
            className="size-7 rounded-md"
          />
          <span className="hidden text-sm font-semibold tracking-tight text-ink sm:block">
            {SITE.name}
          </span>
        </Link>

        {/* Scrolls rather than wrapping: the bar has to stay one pill at every width. */}
        <nav
          aria-label="Primary"
          className="flex min-w-0 flex-1 items-center gap-0.5 overflow-x-auto"
        >
          {PRIMARY_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive(item.href) ? "page" : undefined}
              className={cn(
                "shrink-0 rounded-full px-3.5 py-2 text-sm transition-colors duration-150 ease-out",
                isActive(item.href)
                  ? "bg-surface-hover font-semibold text-ink"
                  : "font-medium text-ink-muted hover:text-ink",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-1">
          <p className="hidden items-center gap-2 rounded-full bg-surface-subtle px-3 py-1.5 lg:flex">
            <span className="text-xs text-ink-subtle">Total</span>
            <span className="text-sm font-semibold tabular-nums text-ink">
              {isBalanceVisible ? formatUsd(totalValueUsd) : MASKED_BALANCE}
            </span>
          </p>

          <button
            type="button"
            onClick={() => setIsBalanceVisible((visible) => !visible)}
            aria-pressed={!isBalanceVisible}
            className={cn(BAR_ICON, "hidden lg:block")}
          >
            <BalanceIcon size={16} aria-hidden />
            <span className="sr-only">
              {isBalanceVisible
                ? "Hide portfolio value"
                : "Show portfolio value"}
            </span>
          </button>

          <FaucetDialog triggerClassName={BAR_ICON} />

          <WalletControl />
        </div>
      </div>
    </header>
  );
};
