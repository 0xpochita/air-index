import { LockOpenIcon, LockSimpleIcon } from "@phosphor-icons/react/dist/ssr";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader } from "@/components/ui/Card";
import { truncateCid } from "@/lib/format";

const LOCKED_COPY =
  "The contenthash role and its admin role were revoked on this resolver, so the methodology can never be rewritten.";
const UNLOCKED_COPY =
  "The creator still holds the contenthash role. The methodology can be replaced until those roles are revoked.";

interface MethodologyCardProps {
  isLocked: boolean;
  cid: string;
}

export const MethodologyCard = ({ isLocked, cid }: MethodologyCardProps) => {
  const StatusIcon = isLocked ? LockSimpleIcon : LockOpenIcon;

  return (
    <Card>
      <CardHeader
        title="Methodology"
        action={
          <Badge tone={isLocked ? "positive" : "neutral"}>
            <StatusIcon size={12} weight="fill" aria-hidden />
            {isLocked ? "Permanently locked" : "Editable"}
          </Badge>
        }
      />
      <div className="space-y-4 px-5 pb-5">
        <p className="text-sm text-ink-muted">
          {isLocked ? LOCKED_COPY : UNLOCKED_COPY}
        </p>
        <dl className="space-y-2 rounded-md bg-surface-subtle p-3">
          <div className="flex items-center justify-between gap-4">
            <dt className="text-xs text-ink-subtle">Contenthash</dt>
            <dd className="font-mono text-xs text-ink">{truncateCid(cid)}</dd>
          </div>
          <div className="flex items-center justify-between gap-4">
            <dt className="text-xs text-ink-subtle">Revoked roles</dt>
            <dd className="font-mono text-xs text-ink">
              {isLocked ? "SET_CONTENTHASH, CLEAR, UPGRADE" : "None"}
            </dd>
          </div>
        </dl>
      </div>
    </Card>
  );
};
