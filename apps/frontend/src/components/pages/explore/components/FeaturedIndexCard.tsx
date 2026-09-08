import { ArrowRightIcon } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { StatBlock } from "@/components/ui/StatBlock";
import { TokenStack } from "@/components/ui/TokenStack";
import { indexHref } from "@/config/navigation";
import { formatCount, formatUsdCompact } from "@/lib/format";
import type { IndexFund } from "@/types/index-fund";

interface FeaturedIndexCardProps {
  index: IndexFund;
}

export const FeaturedIndexCard = ({ index }: FeaturedIndexCardProps) => (
  <Link
    href={indexHref(index.slug)}
    className="group flex flex-col justify-between rounded-xl border border-line bg-surface-subtle p-5 shadow-raised transition-colors duration-150 ease-out hover:bg-surface-hover"
  >
    <div className="space-y-4">
      <TokenStack constituents={index.constituents} size="lg" maxVisible={5} />
      <div className="space-y-1.5">
        <h3 className="flex items-center gap-2 text-base font-semibold text-ink">
          {index.name}
          <ArrowRightIcon
            size={16}
            weight="bold"
            aria-hidden
            className="text-ink-subtle transition-transform duration-150 ease-out group-hover:translate-x-0.5"
          />
        </h3>
        <p className="text-sm text-ink-muted">{index.description}</p>
      </div>
    </div>

    <dl className="mt-8 flex items-end justify-between gap-4">
      <StatBlock label="Holders" value={formatCount(index.holders)} />
      <StatBlock
        label="Total deposits"
        value={formatUsdCompact(index.totalDepositsUsd)}
        align="end"
      />
    </dl>
  </Link>
);
