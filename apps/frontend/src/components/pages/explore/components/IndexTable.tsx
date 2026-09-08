import { LockSimpleIcon } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { ReturnValue } from "@/components/ui/ReturnValue";
import { TokenStack } from "@/components/ui/TokenStack";
import { indexHref } from "@/config/navigation";
import { formatCount, formatUsd } from "@/lib/format";
import type { IndexFund } from "@/types/index-fund";

const HEADER_CLASS = "px-4 py-3 text-xs font-medium text-ink-subtle";

interface IndexTableProps {
  indexes: IndexFund[];
}

export const IndexTable = ({ indexes }: IndexTableProps) => (
  <div className="overflow-x-auto">
    <table className="w-full min-w-[52rem] border-collapse text-left">
      <thead>
        <tr className="border-b border-line">
          <th scope="col" className={HEADER_CLASS}>
            Name
          </th>
          <th scope="col" className={HEADER_CLASS}>
            Constituents
          </th>
          <th scope="col" className={HEADER_CLASS}>
            All time return
          </th>
          <th scope="col" className={HEADER_CLASS}>
            24h return
          </th>
          <th scope="col" className={`${HEADER_CLASS} text-right`}>
            Holders
          </th>
          <th scope="col" className={`${HEADER_CLASS} text-right`}>
            Total deposits
          </th>
        </tr>
      </thead>
      <tbody>
        {indexes.map((index) => (
          <tr
            key={index.slug}
            className="border-b border-line last:border-b-0 transition-colors duration-150 ease-out hover:bg-surface-hover"
          >
            <td className="px-4 py-4">
              <Link href={indexHref(index.slug)} className="block">
                <span className="flex items-center gap-2">
                  <span className="text-sm font-medium text-ink">
                    {index.name}
                  </span>
                  {index.isMethodologyLocked ? (
                    <LockSimpleIcon
                      size={13}
                      weight="fill"
                      aria-label="Methodology locked"
                      className="text-ink-subtle"
                    />
                  ) : null}
                </span>
                <span className="mt-0.5 block max-w-xs truncate text-xs text-ink-muted">
                  {index.ensName}
                </span>
              </Link>
            </td>
            <td className="px-4 py-4">
              <TokenStack
                constituents={index.constituents}
                size="sm"
                maxVisible={4}
              />
            </td>
            <td className="px-4 py-4">
              <ReturnValue value={index.allTimeReturnPct} />
            </td>
            <td className="px-4 py-4">
              <ReturnValue value={index.dayReturnPct} />
            </td>
            <td className="px-4 py-4 text-right text-sm tabular-nums text-ink-muted">
              {formatCount(index.holders)}
            </td>
            <td className="px-4 py-4 text-right text-sm font-semibold tabular-nums text-ink">
              {formatUsd(index.totalDepositsUsd)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);
