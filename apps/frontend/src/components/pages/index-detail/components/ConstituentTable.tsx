import { ArrowSquareOutIcon } from "@phosphor-icons/react/dist/ssr";
import { ResolveNameButton } from "@/components/ens/ResolveNameButton";
import { CopyButton } from "@/components/ui/CopyButton";
import { TokenIcon } from "@/components/ui/TokenIcon";
import { formatWeight, truncateAddress } from "@/lib/format";
import type { Constituent } from "@/types/index-fund";

const HEADER_CLASS = "px-5 py-3 text-xs font-medium text-ink-subtle";
const EXPLORER_ADDRESS = "https://sepolia.etherscan.io/address/";

interface ConstituentTableProps {
  constituents: Constituent[];
  ensName: string;
}

export const ConstituentTable = ({
  constituents,
  ensName,
}: ConstituentTableProps) => (
  <div className="overflow-x-auto">
    <table className="w-full min-w-[44rem] border-collapse text-left">
      <thead>
        <tr className="border-b border-line">
          <th scope="col" className={HEADER_CLASS}>
            Token
          </th>
          <th scope="col" className={HEADER_CLASS}>
            ENS subname
          </th>
          <th scope="col" className={HEADER_CLASS}>
            Address record
          </th>
          <th scope="col" className={`${HEADER_CLASS} text-right`}>
            Weight
          </th>
        </tr>
      </thead>
      <tbody>
        {constituents.map((constituent) => (
          <tr
            key={constituent.token.symbol}
            className="border-b border-line last:border-b-0"
          >
            <td className="px-5 py-4">
              <span className="flex items-center gap-3">
                <TokenIcon token={constituent.token} size="md" />
                <span>
                  <span className="block text-sm font-medium text-ink">
                    {constituent.token.name}
                  </span>
                  <span className="block text-xs uppercase text-ink-subtle">
                    {constituent.token.symbol}
                  </span>
                </span>
              </span>
            </td>
            <td className="px-5 py-4">
              {/*
               * Not a link: no explorer renders an ENSv2 beta name yet, and a
               * dead link on the page that proves the name resolves would
               * argue against itself. Copy it into any ENS library instead.
               */}
              <span className="flex items-center gap-1">
                <span className="font-mono text-xs text-ink-muted">
                  {`${constituent.token.symbol}.${ensName}`}
                </span>
                <CopyButton
                  value={`${constituent.token.symbol}.${ensName}`}
                  label="Copy ENS name"
                />
                <ResolveNameButton
                  name={`${constituent.token.symbol}.${ensName}`}
                />
              </span>
            </td>
            <td className="px-5 py-4">
              <a
                href={`${EXPLORER_ADDRESS}${constituent.token.address}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 font-mono text-xs text-ink-muted transition-colors duration-150 ease-out hover:text-accent"
              >
                {truncateAddress(constituent.token.address)}
                <ArrowSquareOutIcon size={11} aria-hidden />
              </a>
            </td>
            <td className="px-5 py-4 text-right">
              <span className="text-sm font-semibold tabular-nums text-ink">
                {formatWeight(constituent.weightBps)}
              </span>
              <span className="mt-1.5 block h-1 w-full overflow-hidden rounded-full bg-surface-hover">
                <span
                  className="block h-full rounded-full bg-accent"
                  style={{ width: `${constituent.weightBps / 100}%` }}
                />
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);
