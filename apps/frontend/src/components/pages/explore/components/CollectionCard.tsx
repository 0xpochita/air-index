import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { TokenStack } from "@/components/ui/TokenStack";
import { indexHref } from "@/config/navigation";
import { formatUsdCompact } from "@/lib/format";
import type { IndexCollection } from "@/types/index-fund";

interface CollectionCardProps {
  collection: IndexCollection;
}

export const CollectionCard = ({ collection }: CollectionCardProps) => (
  <Card tone="accent" className="flex flex-col p-5">
    <h3 className="text-base font-semibold text-ink">{collection.title}</h3>

    <div className="mt-5 flex items-center justify-between px-1 text-xs font-medium text-ink-subtle">
      <span>Index</span>
      <span>Total deposits</span>
    </div>

    <ul className="mt-2 flex flex-col gap-2">
      {collection.indexes.map((index) => (
        <li key={index.slug}>
          <Link
            href={indexHref(index.slug)}
            className="flex items-center justify-between gap-3 rounded-md bg-surface px-3 py-2.5 transition-colors duration-150 ease-out hover:bg-surface-hover"
          >
            <span className="flex min-w-0 items-center gap-2.5">
              <TokenStack
                constituents={index.constituents}
                size="sm"
                maxVisible={2}
              />
              <span className="truncate text-sm font-medium text-ink">
                {index.name}
              </span>
            </span>
            <span className="shrink-0 text-sm font-semibold tabular-nums text-ink">
              {formatUsdCompact(index.totalDepositsUsd)}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  </Card>
);
