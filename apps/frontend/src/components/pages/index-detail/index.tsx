import { ArrowLeftIcon, LockSimpleIcon } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { ReturnValue } from "@/components/ui/ReturnValue";
import { StatBlock } from "@/components/ui/StatBlock";
import { TokenStack } from "@/components/ui/TokenStack";
import { swapHref } from "@/config/navigation";
import { toDisplayConstituents } from "@/lib/ens/constituents";
import type { OnchainIndex } from "@/lib/ens/indexes";
import { formatCount, formatUsd, truncateAddress } from "@/lib/format";
import type { IndexFund } from "@/types/index-fund";
import { ConstituentTable } from "./components/ConstituentTable";
import { MethodologyCard } from "./components/MethodologyCard";
import { OnchainPanel } from "./components/OnchainPanel";
import { RebalancerCard } from "./components/RebalancerCard";

interface IndexDetailPageProps {
  index: IndexFund;
  onchain: OnchainIndex | null;
}

export const IndexDetailPage = ({ index, onchain }: IndexDetailPageProps) => {
  const constituents = onchain
    ? toDisplayConstituents(onchain.constituents)
    : index.constituents;

  return (
    <div className="space-y-6">
      <Link
        href="/explore"
        className="inline-flex items-center gap-2 text-sm font-medium text-ink-muted transition-colors duration-150 ease-out hover:text-ink"
      >
        <ArrowLeftIcon size={16} weight="bold" aria-hidden />
        Explore
      </Link>

      <header className="flex flex-wrap items-start justify-between gap-6">
        <div className="flex items-start gap-4">
          <TokenStack
            constituents={index.constituents}
            size="lg"
            maxVisible={4}
          />
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight text-ink">
                {index.name}
              </h1>
              {index.ticker ? (
                <Badge tone="accent">{`${index.ticker}.airindex.eth`}</Badge>
              ) : null}
              {index.isMethodologyLocked ? (
                <Badge tone="positive">
                  <LockSimpleIcon size={12} weight="fill" aria-hidden />
                  Locked
                </Badge>
              ) : null}
            </div>
            <p className="font-mono text-sm text-ink-muted">{index.ensName}</p>
            <p className="max-w-2xl text-sm text-ink-muted">
              {index.description}
            </p>
          </div>
        </div>

        <ButtonLink href={swapHref(index.slug)}>Deposit</ButtonLink>
      </header>

      <Card>
        <dl className="grid grid-cols-2 gap-6 p-5 lg:grid-cols-5">
          <StatBlock
            label="Total deposits"
            value={formatUsd(index.totalDepositsUsd)}
          />
          <StatBlock label="Holders" value={formatCount(index.holders)} />
          <StatBlock
            label="All time return"
            value={<ReturnValue value={index.allTimeReturnPct} />}
          />
          <StatBlock
            label="24h return"
            value={<ReturnValue value={index.dayReturnPct} />}
          />
          <StatBlock label="Creator" value={truncateAddress(index.creator)} />
        </dl>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader
          title="Constituents"
          action={
            <span className="text-xs text-ink-subtle">
              {onchain
                ? `${constituents.length} subnames, read onchain`
                : `${constituents.length} subnames`}
            </span>
          }
        />
        <ConstituentTable constituents={constituents} ensName={index.ensName} />
      </Card>

      {onchain ? <OnchainPanel onchain={onchain} /> : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <MethodologyCard
          isLocked={onchain?.isMethodologyLocked ?? index.isMethodologyLocked}
          cid={index.methodologyCid}
        />
        <RebalancerCard agent={onchain?.agent ?? null} />
      </div>
    </div>
  );
};
