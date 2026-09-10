"use client";

import {
  CaretDownIcon,
  CheckIcon,
  SignOutIcon,
  WarningIcon,
} from "@phosphor-icons/react/dist/ssr";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Notch } from "@/components/ui/notch";
import { PRIMARY_NAV } from "@/config/navigation";
import { SITE } from "@/config/site";
import { cn } from "@/lib/cn";
import { truncateAddress } from "@/lib/format";
import { useWallet } from "@/lib/onchain/WalletProvider";
import { FaucetDialog } from "./FaucetDialog";

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
        className="rounded-full bg-accent px-3.5 py-1.5 text-sm font-medium text-ink-inverse transition-colors duration-150 ease-out hover:bg-accent-hover"
      >
        Get a wallet
      </a>
    );
  }

  if (!address) {
    return (
      <button
        type="button"
        onClick={connect}
        disabled={isConnecting}
        className="rounded-full bg-accent px-3.5 py-1.5 text-sm font-medium text-ink-inverse transition-colors duration-150 ease-out hover:bg-accent-hover disabled:opacity-60"
      >
        {isConnecting ? "Connecting…" : "Connect"}
      </button>
    );
  }

  if (!isSepolia) {
    return (
      <button
        type="button"
        onClick={switchNetwork}
        className="flex items-center gap-1.5 rounded-full bg-negative px-3 py-1.5 text-sm font-medium text-ink-inverse transition-opacity duration-150 ease-out hover:opacity-90"
      >
        <WarningIcon size={14} weight="fill" aria-hidden />
        {SITE.network}
      </button>
    );
  }

  return (
    <span className="flex items-center gap-1.5">
      <span className="size-7 shrink-0 rounded-full bg-accent" aria-hidden />
      <span className="hidden font-mono text-sm font-medium text-ink sm:block">
        {truncateAddress(address)}
      </span>
      <button
        type="button"
        onClick={disconnect}
        title="Disconnect wallet"
        className={cn(BAR_ICON, "hover:text-negative")}
      >
        <SignOutIcon size={15} weight="bold" aria-hidden />
        <span className="sr-only">Disconnect wallet</span>
      </button>
    </span>
  );
};

export const Navbar = () => {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  const active = PRIMARY_NAV.find((item) => isActive(item.href));
  const ActiveIcon = active?.icon;

  /** A tap outside is the only dismissal — the trigger lives inside the notch. */
  useEffect(() => {
    if (!isMenuOpen) {
      return;
    }

    const close = (event: globalThis.MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [isMenuOpen]);

  return (
    <header className="sticky top-0 z-40 flex justify-center px-8">
      <div ref={menuRef} className="relative">
        <Notch className="h-12 gap-2 px-3">
          <Link href="/explore" className="flex shrink-0 items-center gap-2">
            <Image
              src="/assets/logo-airindex.png"
              alt=""
              width={26}
              height={26}
              priority
              className="size-[26px] rounded-md"
            />
            <span className="hidden text-sm font-semibold tracking-tight text-ink sm:block">
              {SITE.name}
            </span>
          </Link>

          <span aria-hidden className="h-5 w-px shrink-0 bg-line" />

          <button
            type="button"
            onClick={() => setIsMenuOpen((open) => !open)}
            aria-expanded={isMenuOpen}
            aria-haspopup="menu"
            className="flex shrink-0 items-center gap-1.5 rounded-full px-2 py-1.5 text-sm font-semibold text-ink transition-colors duration-150 ease-out hover:bg-surface-hover"
          >
            {ActiveIcon ? (
              <ActiveIcon size={16} aria-hidden className="text-ink-muted" />
            ) : null}
            {active?.label ?? "Menu"}
            <CaretDownIcon
              size={12}
              weight="bold"
              aria-hidden
              className={cn(
                "text-ink-subtle transition-transform duration-150 ease-out",
                isMenuOpen && "rotate-180",
              )}
            />
          </button>

          <span aria-hidden className="h-5 w-px shrink-0 bg-line" />

          <FaucetDialog triggerClassName={BAR_ICON} />

          <WalletControl />
        </Notch>

        {isMenuOpen ? (
          <nav
            aria-label="Primary"
            className="absolute top-full left-1/2 mt-2 flex w-56 -translate-x-1/2 flex-col gap-0.5 rounded-2xl border border-line bg-surface p-1.5 shadow-floating"
          >
            {PRIMARY_NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMenuOpen(false)}
                aria-current={isActive(item.href) ? "page" : undefined}
                className={cn(
                  "flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm transition-colors duration-150 ease-out",
                  isActive(item.href)
                    ? "bg-ink font-semibold text-ink-inverse"
                    : "font-medium text-ink-muted hover:bg-surface-hover hover:text-ink",
                )}
              >
                <item.icon size={16} aria-hidden />
                <span className="flex-1">{item.label}</span>
                {isActive(item.href) ? (
                  <CheckIcon size={13} weight="bold" aria-hidden />
                ) : null}
              </Link>
            ))}
          </nav>
        ) : null}
      </div>
    </header>
  );
};
