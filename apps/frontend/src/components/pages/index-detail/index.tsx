import { ArrowLeftIcon, LockSimpleIcon } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { CopyButton } from "@/components/ui/CopyButton";
import { TokenStack } from "@/components/ui/TokenStack";
import { swapHref } from "@/config/navigation";
import type { LiveIndex } from "@/lib/onchain/vaults";
import { ConstituentTable } from "./components/ConstituentTable";
import { OnchainPanel } from "./components/OnchainPanel";
import { RebalancerCard } from "./components/RebalancerCard";

interface IndexDetailPageProps {
  index: LiveIndex;
}

export const IndexDetailPage = ({ index }: IndexDetailPageProps) => (
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
            {index.isMethodologyLocked ? (
              <Badge tone="positive">
                <LockSimpleIcon size={12} weight="fill" aria-hidden />
                Locked
              </Badge>
            ) : null}
          </div>
          <p className="flex items-center gap-1">
            <span className="font-mono text-sm text-ink-muted">
              {index.ensName}
            </span>
            <CopyButton value={index.ensName} label="Copy ENS name" size={14} />
          </p>
          {index.description ? (
            <p className="max-w-2xl text-sm text-ink-muted">
              {index.description}
            </p>
          ) : null}
        </div>
      </div>

      {index.vault ? (
        <ButtonLink href={swapHref(index.slug)}>Deposit</ButtonLink>
      ) : (
        <span className="rounded-full bg-surface-subtle px-3.5 py-2 text-sm text-ink-muted">
          No share token yet
        </span>
      )}
    </header>

    <Card className="overflow-hidden">
      <CardHeader
        title="Constituents"
        action={
          <span className="text-xs text-ink-subtle">
            {`${index.constituents.length} subnames, none registered`}
          </span>
        }
      />
      <ConstituentTable
        constituents={index.constituents}
        ensName={index.ensName}
      />
    </Card>

    <div className="grid gap-4 lg:grid-cols-2">
      <OnchainPanel index={index} />
      <RebalancerCard agent={index.agent} />
    </div>
  </div>
);
