import Link from "next/link";
import { ButtonLink } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ReturnValue } from "@/components/ui/ReturnValue";
import { TokenStack } from "@/components/ui/TokenStack";
import { indexHref } from "@/config/navigation";
import { formatUsd } from "@/lib/format";
import type { PortfolioPosition } from "@/types/index-fund";

interface PositionListProps {
  positions: PortfolioPosition[];
}

export const PositionList = ({ positions }: PositionListProps) => (
  <Card className="overflow-hidden">
    <CardHeader title="Positions" />
    {positions.length > 0 ? (
      <ul>
        {positions.map((position) => (
          <li key={position.index.slug} className="border-t border-line">
            <Link
              href={indexHref(position.index.slug)}
              className="flex items-center justify-between gap-4 px-5 py-4 transition-colors duration-150 ease-out hover:bg-surface-hover"
            >
              <span className="flex min-w-0 items-center gap-3">
                <TokenStack
                  constituents={position.index.constituents}
                  size="sm"
                  maxVisible={3}
                />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-ink">
                    {position.index.name}
                  </span>
                  <span className="block truncate font-mono text-xs text-ink-muted">
                    {position.index.ensName}
                  </span>
                </span>
              </span>
              <span className="flex shrink-0 flex-col items-end gap-0.5">
                <span className="text-sm font-semibold tabular-nums text-ink">
                  {formatUsd(position.valueUsd)}
                </span>
                <ReturnValue
                  value={position.dayChangePct}
                  className="text-xs"
                />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    ) : (
      <EmptyState
        title="No positions yet"
        description="Deposit into an index to see it tracked here."
        action={<ButtonLink href="/explore">Explore indexes</ButtonLink>}
      />
    )}
  </Card>
);
