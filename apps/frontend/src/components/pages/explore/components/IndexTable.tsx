import { BroadcastIcon, LockSimpleIcon } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { TokenStack } from "@/components/ui/TokenStack";
import { indexHref } from "@/config/navigation";
import type { IndexFund } from "@/types/index-fund";

const HEADER_CLASS =
  "px-5 py-2.5 text-xs font-medium text-ink-subtle bg-surface-subtle";

interface IndexTableProps {
  indexes: IndexFund[];
  liveSlugs: Set<string>;
}

/**
 * Name and composition, and nothing else. Returns, holder counts and deposit
 * totals are not ENS records and nobody can check them — a table of numbers the
 * chain cannot back is worse than no table.
 */
export const IndexTable = ({ indexes, liveSlugs }: IndexTableProps) => (
  <div className="overflow-x-auto">
    <table className="w-full min-w-[42rem] border-collapse text-left">
      <thead>
        <tr>
          <th scope="col" className={`${HEADER_CLASS} rounded-l-lg`}>
            Name
          </th>
          <th scope="col" className={HEADER_CLASS}>
            Holds
          </th>
          <th scope="col" className={`${HEADER_CLASS} rounded-r-lg`}>
            Methodology
          </th>
        </tr>
      </thead>
      <tbody>
        {indexes.map((index) => (
          <tr
            key={index.slug}
            className="border-b border-line last:border-b-0 transition-colors duration-150 ease-out hover:bg-surface-hover"
          >
            <td className="px-5 py-4">
              <Link href={indexHref(index.slug)} className="block">
                <span className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-ink">
                    {index.name}
                  </span>
                  {liveSlugs.has(index.slug) ? (
                    <BroadcastIcon
                      size={13}
                      weight="fill"
                      aria-label="Live on Sepolia"
                      className="text-positive"
                    />
                  ) : null}
                  {index.isMethodologyLocked ? (
                    <LockSimpleIcon
                      size={13}
                      weight="fill"
                      aria-label="Methodology locked"
                      className="text-ink-subtle"
                    />
                  ) : null}
                </span>
                <span className="mt-0.5 block truncate font-mono text-xs text-ink-muted">
                  {index.ensName}
                </span>
              </Link>
            </td>
            <td className="px-5 py-4">
              <TokenStack
                constituents={index.constituents}
                size="sm"
                maxVisible={5}
              />
            </td>
            <td className="max-w-md px-5 py-4 text-sm text-ink-muted">
              {index.description}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);
