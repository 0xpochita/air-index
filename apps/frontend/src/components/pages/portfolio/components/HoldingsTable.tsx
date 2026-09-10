import Link from "next/link";
import { ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ReturnValue } from "@/components/ui/ReturnValue";
import { SoftCard } from "@/components/ui/SoftCard";
import { TokenStack } from "@/components/ui/TokenStack";
import { indexHref, swapHref } from "@/config/navigation";
import { formatAmount, formatUsd, formatWeight } from "@/lib/format";
import { getUnitPriceUsd } from "@/lib/index-math";
import { getPortfolioValueUsd } from "@/lib/portfolio";
import type { PortfolioPosition } from "@/types/index-fund";

const HEADER_CLASS = "px-5 py-3 text-xs font-medium text-ink-subtle";
const BASIS_POINTS_PER_UNIT = 10_000;

interface HoldingsTableProps {
  positions: PortfolioPosition[];
}

export const HoldingsTable = ({ positions }: HoldingsTableProps) => {
  const totalValueUsd = getPortfolioValueUsd(positions);

  if (positions.length === 0) {
    return (
      <SoftCard title="Holdings">
        <div className="soft-inset rounded-[1.35rem] bg-surface-subtle">
          <EmptyState
            title="No holdings yet"
            description="Deposit into an index and it will appear here with its unit balance."
            action={<ButtonLink href="/explore">Explore indexes</ButtonLink>}
          />
        </div>
      </SoftCard>
    );
  }

  return (
    <SoftCard title="Holdings">
      <div className="soft-inset overflow-x-auto rounded-[1.35rem] bg-surface-subtle">
        <table className="w-full min-w-[46rem] border-collapse text-left">
          <thead>
            <tr className="border-b border-line">
              <th scope="col" className={HEADER_CLASS}>
                Index
              </th>
              <th scope="col" className={`${HEADER_CLASS} text-right`}>
                Units
              </th>
              <th scope="col" className={`${HEADER_CLASS} text-right`}>
                Unit price
              </th>
              <th scope="col" className={`${HEADER_CLASS} text-right`}>
                Value
              </th>
              <th scope="col" className={`${HEADER_CLASS} text-right`}>
                Share
              </th>
              <th scope="col" className={`${HEADER_CLASS} text-right`}>
                24h
              </th>
              <th scope="col" className={HEADER_CLASS}>
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {positions.map((position) => {
              const unitPriceUsd =
                position.units > 0
                  ? position.valueUsd / position.units
                  : getUnitPriceUsd(position.index);
              const shareBps =
                (position.valueUsd / totalValueUsd) * BASIS_POINTS_PER_UNIT;

              return (
                <tr
                  key={position.index.slug}
                  className="border-b border-line last:border-b-0"
                >
                  <td className="px-5 py-4">
                    <Link
                      href={indexHref(position.index.slug)}
                      className="flex items-center gap-3"
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
                        <span className="block truncate font-mono text-xs text-ink-muted">
                          {position.index.ensName}
                        </span>
                      </span>
                    </Link>
                  </td>
                  <td className="px-5 py-4 text-right text-sm tabular-nums text-ink-muted">
                    {formatAmount(position.units)}
                  </td>
                  <td className="px-5 py-4 text-right text-sm tabular-nums text-ink-muted">
                    {formatUsd(unitPriceUsd)}
                  </td>
                  <td className="px-5 py-4 text-right text-sm font-semibold tabular-nums text-ink">
                    {formatUsd(position.valueUsd)}
                  </td>
                  <td className="px-5 py-4 text-right text-sm tabular-nums text-ink-muted">
                    {formatWeight(shareBps)}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <ReturnValue value={position.dayChangePct} />
                  </td>
                  <td className="px-5 py-4 text-right">
                    <ButtonLink
                      href={swapHref(position.index.slug)}
                      variant="secondary"
                      className="px-3 py-1.5 text-xs"
                    >
                      Manage
                    </ButtonLink>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </SoftCard>
  );
};
