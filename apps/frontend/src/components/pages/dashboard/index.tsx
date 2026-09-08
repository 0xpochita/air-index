import Link from "next/link";
import { ButtonLink } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { ReturnValue } from "@/components/ui/ReturnValue";
import { StatBlock } from "@/components/ui/StatBlock";
import { TokenStack } from "@/components/ui/TokenStack";
import { indexHref } from "@/config/navigation";
import { formatUsd } from "@/lib/format";
import { getPortfolioPositions } from "@/lib/mock/indexes";

export const DashboardPage = () => {
  const positions = getPortfolioPositions();
  const totalValueUsd = positions.reduce(
    (total, position) => total + position.valueUsd,
    0,
  );
  const weightedDayChangePct = positions.reduce(
    (total, position) =>
      total + position.dayChangePct * (position.valueUsd / totalValueUsd),
    0,
  );

  return (
    <div className="space-y-8">
      <PageHeader
        title="Dashboard"
        description="Your positions across every Air Index fund."
        action={
          <ButtonLink href="/explore" variant="secondary">
            Explore indexes
          </ButtonLink>
        }
      />

      <Card>
        <dl className="grid grid-cols-2 gap-6 p-5 lg:grid-cols-4">
          <StatBlock label="Portfolio value" value={formatUsd(totalValueUsd)} />
          <StatBlock
            label="24h change"
            value={<ReturnValue value={weightedDayChangePct} />}
          />
          <StatBlock label="Indexes held" value={positions.length} />
          <StatBlock label="Network" value="Sepolia" />
        </dl>
      </Card>

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
    </div>
  );
};
