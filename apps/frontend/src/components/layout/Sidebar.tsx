"use client";

import {
  CaretDownIcon,
  ChartPieSliceIcon,
} from "@phosphor-icons/react/dist/ssr";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { TokenStack } from "@/components/ui/TokenStack";
import { indexHref, type NavItem, PRIMARY_NAV } from "@/config/navigation";
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
        ? "bg-canvas/65 font-semibold text-ink"
        : "font-medium text-ink-muted hover:bg-canvas/55 hover:text-ink",
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
    <aside className="flex h-full flex-col gap-8 px-4 py-5">
      <Link href="/explore" className="flex items-center gap-2 px-3">
        <Image
          src="/assets/logo-airindex.png"
          alt=""
          width={28}
          height={28}
          priority
          className="rounded-md"
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

        <div className="relative">
          <Link
            href="/portfolio"
            aria-current={isActive("/portfolio") ? "page" : undefined}
            className={cn(
              LINK_CLASS,
              "pr-10",
              isActive("/portfolio")
                ? "bg-canvas/65 font-semibold text-ink"
                : "font-medium text-ink-muted hover:bg-canvas/55 hover:text-ink",
            )}
          >
            <ChartPieSliceIcon
              size={18}
              weight={isActive("/portfolio") ? "fill" : "regular"}
              aria-hidden
            />
            Portfolio
          </Link>

          <button
            type="button"
            onClick={() => setIsPortfolioOpen((open) => !open)}
            aria-expanded={isPortfolioOpen}
            aria-controls="portfolio-positions"
            className="absolute top-1/2 right-1.5 -translate-y-1/2 rounded-md p-1 text-ink-subtle transition-colors duration-150 ease-out hover:bg-canvas/65 hover:text-ink"
          >
            <CaretDownIcon
              size={14}
              weight="bold"
              aria-hidden
              className={cn(
                "transition-transform duration-150 ease-out",
                !isPortfolioOpen && "-rotate-90",
              )}
            />
            <span className="sr-only">
              {isPortfolioOpen ? "Collapse holdings" : "Expand holdings"}
            </span>
          </button>
        </div>

        {isPortfolioOpen ? (
          <ul
            id="portfolio-positions"
            className="ml-6 flex flex-col gap-0.5 border-l border-canvas/60 pl-2"
          >
            {positions.map((position) => (
              <li key={position.index.slug}>
                <Link
                  href={indexHref(position.index.slug)}
                  aria-current={
                    isActive(indexHref(position.index.slug))
                      ? "page"
                      : undefined
                  }
                  className={cn(
                    "flex items-center gap-2.5 rounded-md px-2.5 py-1.5 transition-colors duration-150 ease-out",
                    isActive(indexHref(position.index.slug))
                      ? "bg-canvas/65"
                      : "hover:bg-canvas/55",
                  )}
                >
                  <TokenStack
                    constituents={position.index.constituents}
                    size="sm"
                    maxVisible={3}
                  />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-ink">
                      {position.index.name}
                    </span>
                    <span className="flex items-center gap-1.5 text-xs tabular-nums">
                      <span className="text-ink-subtle">
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
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : null}
      </nav>
    </aside>
  );
};
