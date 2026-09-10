import {
  BroadcastIcon,
  LinkSimpleIcon,
  LockSimpleIcon,
  SealCheckIcon,
} from "@phosphor-icons/react/dist/ssr";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader } from "@/components/ui/Card";
import { SITE } from "@/config/site";
import type { OnchainIndex } from "@/lib/ens/indexes";
import { truncateAddress } from "@/lib/format";
import { LockMethodologyButton } from "./LockMethodologyButton";

const EXPLORER_ADDRESS = "https://sepolia.etherscan.io/address/";

interface OnchainPanelProps {
  onchain: OnchainIndex;
}

export const OnchainPanel = ({ onchain }: OnchainPanelProps) => (
  <Card>
    <CardHeader
      title="Onchain state"
      action={
        <Badge tone="positive">
          <BroadcastIcon size={12} weight="fill" aria-hidden />
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
          {onchain.shareToken ? (
            <a
              href={`${EXPLORER_ADDRESS}${onchain.shareToken}`}
              target="_blank"
              rel="noreferrer"
              className="hover:text-accent"
            >
              {truncateAddress(onchain.shareToken)}
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
          {new Date(Number(onchain.expiry) * 1000).toLocaleDateString("en-CA")}
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
