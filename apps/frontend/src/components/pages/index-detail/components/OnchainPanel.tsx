import {
  LinkSimpleIcon,
  LockSimpleIcon,
  SealCheckIcon,
} from "@phosphor-icons/react/dist/ssr";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader } from "@/components/ui/Card";
import { TokenIcon } from "@/components/ui/TokenIcon";
import { SITE } from "@/config/site";
import { truncateAddress } from "@/lib/format";
import type { LiveIndex } from "@/lib/onchain/vaults";
import { TOKENS } from "@/lib/tokens/registry";
import { LockMethodologyButton } from "./LockMethodologyButton";

const EXPLORER_ADDRESS = "https://sepolia.etherscan.io/address/";

interface OnchainPanelProps {
  index: LiveIndex;
}

export const OnchainPanel = ({ index: onchain }: OnchainPanelProps) => (
  <Card>
    <CardHeader
      title="Onchain state"
      action={
        <Badge tone="positive">
          <TokenIcon token={TOKENS.eth} size="sm" className="size-3.5 ring-0" />
          {`Live on ${SITE.network}`}
        </Badge>
      }
    />
    <dl className="space-y-2.5 px-5 pb-5 text-sm">
      <div className="flex items-center justify-between gap-4">
        <dt className="text-ink-subtle">Resolver</dt>
        <dd className="font-mono text-xs text-ink">
          {truncateAddress(onchain.resolver)}
        </dd>
      </div>
      <div className="flex items-center justify-between gap-4">
        <dt className="text-ink-subtle">Owner</dt>
        <dd className="font-mono text-xs text-ink">
          {truncateAddress(onchain.owner)}
        </dd>
      </div>
      <div className="flex items-center justify-between gap-4">
        <dt className="text-ink-subtle">Constituents</dt>
        <dd className="tabular-nums text-ink">{onchain.constituents.length}</dd>
      </div>
      <div className="flex items-center justify-between gap-4">
        <dt className="text-ink-subtle">Share token</dt>
        <dd className="font-mono text-xs text-ink">
          {onchain.vault ? (
            <a
              href={`${EXPLORER_ADDRESS}${onchain.vault}`}
              target="_blank"
              rel="noreferrer"
              className="hover:text-accent"
            >
              {truncateAddress(onchain.vault)}
            </a>
          ) : (
            <span className="text-ink-muted">Not published</span>
          )}
        </dd>
      </div>
      <div className="flex items-center justify-between gap-4">
        <dt className="text-ink-subtle">Ownership</dt>
        <dd>
          {onchain.isTransferable ? (
            <span className="text-xs text-ink-muted">Transferable</span>
          ) : (
            <Badge tone="accent">
              <LinkSimpleIcon size={12} weight="bold" aria-hidden />
              Soulbound
            </Badge>
          )}
        </dd>
      </div>
      <div className="flex items-center justify-between gap-4">
        <dt className="text-ink-subtle">Expires</dt>
        <dd className="tabular-nums text-xs text-ink">
          {new Date(onchain.expiresAt * 1000).toLocaleDateString("en-CA")}
        </dd>
      </div>
      <div className="flex items-center justify-between gap-4">
        <dt className="text-ink-subtle">Resolver provenance</dt>
        <dd>
          {onchain.isVerifiedResolver ? (
            <Badge tone="accent">
              <SealCheckIcon size={12} weight="fill" aria-hidden />
              Factory verified
            </Badge>
          ) : (
            <span className="text-xs text-ink-muted">Unverified</span>
          )}
        </dd>
      </div>
      <div className="flex items-center justify-between gap-4">
        <dt className="text-ink-subtle">Methodology</dt>
        <dd>
          {onchain.isMethodologyLocked ? (
            <Badge tone="positive">
              <LockSimpleIcon size={12} weight="fill" aria-hidden />
              Locked
            </Badge>
          ) : (
            <LockMethodologyButton
              resolver={onchain.resolver}
              owner={onchain.owner}
            />
          )}
        </dd>
      </div>
    </dl>
  </Card>
);
