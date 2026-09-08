"use client";

import { CaretDownIcon, WindIcon } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  indexHref,
  type NavItem,
  PRIMARY_NAV,
  SECONDARY_NAV,
} from "@/config/navigation";
import { SITE } from "@/config/site";
import { cn } from "@/lib/cn";
import { formatSignedPercent, formatUsd } from "@/lib/format";
import type { PortfolioPosition } from "@/types/index-fund";

const LINK_CLASS =
  "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors duration-150 ease-out";

interface SidebarLinkProps {
  item: NavItem;
  isActive: boolean;
}

const SidebarLink = ({ item, isActive }: SidebarLinkProps) => (
  <Link
    href={item.href}
    aria-current={isActive ? "page" : undefined}
    className={cn(
      LINK_CLASS,
      isActive
        ? "bg-surface-hover font-semibold text-ink"
        : "font-medium text-ink-muted hover:bg-surface-hover hover:text-ink",
    )}
  >
    <item.icon size={18} weight={isActive ? "fill" : "regular"} aria-hidden />
    {item.label}
  </Link>
);

interface SidebarProps {
  positions: PortfolioPosition[];
}

export const Sidebar = ({ positions }: SidebarProps) => {
  const pathname = usePathname();
  const [isPortfolioOpen, setIsPortfolioOpen] = useState(true);

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  return (
    <aside className="flex h-full flex-col gap-8 border-r border-line bg-canvas px-4 py-5">
      <Link href="/explore" className="flex items-center gap-2 px-3">
        <WindIcon
          size={22}
          weight="duotone"
          className="text-accent"
          aria-hidden
        />
        <span className="text-base font-semibold tracking-tight text-ink">
          {SITE.name}
        </span>
      </Link>

      <nav aria-label="Primary" className="flex flex-col gap-1">
        {PRIMARY_NAV.map((item) => (
          <SidebarLink
            key={item.href}
            item={item}
            isActive={isActive(item.href)}
          />
        ))}

        <div className="mt-2">
          <button
            type="button"
            onClick={() => setIsPortfolioOpen((open) => !open)}
            aria-expanded={isPortfolioOpen}
            className={cn(
              LINK_CLASS,
              "w-full font-medium text-ink-muted hover:text-ink",
            )}
          >
            <CaretDownIcon
              size={16}
              weight="bold"
              aria-hidden
              className={cn(
                "transition-transform duration-150 ease-out",
                !isPortfolioOpen && "-rotate-90",
              )}
            />
            Portfolio
          </button>

          {isPortfolioOpen ? (
            <ul className="mt-1 flex flex-col gap-1">
              {positions.map((position) => (
                <li key={position.index.slug}>
                  <Link
                    href={indexHref(position.index.slug)}
                    className="block rounded-md px-3 py-2 transition-colors duration-150 ease-out hover:bg-surface-hover"
                  >
                    <span className="block truncate text-sm font-medium text-ink">
                      {position.index.name}
                    </span>
                    <span className="mt-0.5 flex items-center gap-2 text-xs tabular-nums">
                      <span className="text-ink-muted">
                        {formatUsd(position.valueUsd)}
                      </span>
                      <span
                        className={
                          position.dayChangePct < 0
                            ? "text-negative"
                            : "text-positive"
                        }
                      >
                        {formatSignedPercent(position.dayChangePct)}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </nav>

      <nav aria-label="Secondary" className="mt-auto flex flex-col gap-1">
        {SECONDARY_NAV.map((item) => (
          <SidebarLink
            key={item.href}
            item={item}
            isActive={isActive(item.href)}
          />
        ))}
      </nav>
    </aside>
  );
};
