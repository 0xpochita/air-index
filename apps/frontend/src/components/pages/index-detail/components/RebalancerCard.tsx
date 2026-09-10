import { RobotIcon } from "@phosphor-icons/react/dist/ssr";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import type { OnchainAgent } from "@/lib/ens/read";
import { truncateAddress } from "@/lib/format";

const EXPLORER_ADDRESS = "https://sepolia.etherscan.io/address/";

interface RebalancerCardProps {
  agent: OnchainAgent | null;
}

/**
 * Everything here is resolved from the agent's own name. Nothing is supplied by
 * the app, which is the claim: the agent is a namespace with an identity and a
 * permission, not a row in our database.
 */
export const RebalancerCard = ({ agent }: RebalancerCardProps) => (
  <Card>
    <CardHeader
      title="Rebalancer"
      action={
        agent ? (
          <Badge tone="accent">
            <RobotIcon size={12} weight="fill" aria-hidden />
            Delegated
          </Badge>
        ) : null
      }
    />
    {agent ? (
      <div className="space-y-4 px-5 pb-5">
        {agent.mandate ? (
          <p className="text-sm text-ink-muted">{agent.mandate}</p>
        ) : null}
        <dl className="space-y-2 rounded-md bg-surface-subtle p-3">
          <div className="flex items-center justify-between gap-4">
            <dt className="text-xs text-ink-subtle">Identity</dt>
            <dd className="truncate font-mono text-xs text-ink">
              {agent.ensName}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-4">
            <dt className="text-xs text-ink-subtle">Agent</dt>
            <dd className="font-mono text-xs text-ink">
              <a
                href={`${EXPLORER_ADDRESS}${agent.address}`}
                target="_blank"
                rel="noreferrer"
                className="hover:text-accent"
              >
                {truncateAddress(agent.address)}
              </a>
            </dd>
          </div>
          {agent.delegatedKey ? (
            <div className="flex items-center justify-between gap-4">
              <dt className="text-xs text-ink-subtle">Scoped to key</dt>
              <dd className="font-mono text-xs text-ink">
                {agent.delegatedKey}
              </dd>
            </div>
          ) : null}
        </dl>
      </div>
    ) : (
      <EmptyState
        title="No rebalancer"
        description="Weights on this index are set by its owner. Delegating a scoped agent is optional, and publishing one gives it a name of its own."
      />
    )}
  </Card>
);
