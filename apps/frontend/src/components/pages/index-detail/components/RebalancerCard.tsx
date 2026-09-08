import { RobotIcon } from "@phosphor-icons/react/dist/ssr";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { truncateAddress } from "@/lib/format";
import type { Rebalancer } from "@/types/index-fund";

interface RebalancerCardProps {
  rebalancer: Rebalancer | null;
  ensName: string;
}

export const RebalancerCard = ({
  rebalancer,
  ensName,
}: RebalancerCardProps) => (
  <Card>
    <CardHeader
      title="Rebalancer"
      action={
        rebalancer ? (
          <Badge tone="accent">
            <RobotIcon size={12} weight="fill" aria-hidden />
            Delegated
          </Badge>
        ) : null
      }
    />
    {rebalancer ? (
      <div className="space-y-4 px-5 pb-5">
        <p className="text-sm text-ink-muted">{rebalancer.mandate}</p>
        <dl className="space-y-2 rounded-md bg-surface-subtle p-3">
          <div className="flex items-center justify-between gap-4">
            <dt className="text-xs text-ink-subtle">Identity</dt>
            <dd className="font-mono text-xs text-ink">{`rebalancer.${ensName}`}</dd>
          </div>
          <div className="flex items-center justify-between gap-4">
            <dt className="text-xs text-ink-subtle">Agent</dt>
            <dd className="font-mono text-xs text-ink">
              {truncateAddress(rebalancer.address)}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-4">
            <dt className="text-xs text-ink-subtle">Scoped to key</dt>
            <dd className="font-mono text-xs text-ink">
              {rebalancer.delegatedKey}
            </dd>
          </div>
        </dl>
      </div>
    ) : (
      <EmptyState
        title="No rebalancer"
        description="Weights on this index are set manually by its creator. Delegating a scoped agent is optional."
      />
    )}
  </Card>
);
