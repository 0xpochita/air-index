"use client";

import Image from "next/image";
import { ReturnValue } from "@/components/ui/ReturnValue";
import { SITE } from "@/config/site";
import { formatUsd, truncateAddress } from "@/lib/format";
import { useWallet } from "@/lib/onchain/WalletProvider";

const IMAGE_QUALITY = 90;

interface PortfolioCoverProps {
  totalValueUsd: number;
  dayChangePct: number;
  holdingCount: number;
}

export const PortfolioCover = ({
  totalValueUsd,
  dayChangePct,
  holdingCount,
}: PortfolioCoverProps) => {
  const { address } = useWallet();

  return (
    <section className="soft-shell grid overflow-hidden rounded-[1.75rem] bg-surface/90 backdrop-blur-xl sm:grid-cols-[14rem_minmax(0,1fr)]">
      <div className="relative isolate hidden min-h-56 sm:block">
        <Image
          src="/assets/cat-ui-bg-2.jpg"
          alt=""
          fill
          priority
          quality={IMAGE_QUALITY}
          sizes="14rem"
          className="object-cover object-center"
        />
      </div>

      <div className="flex flex-col justify-center gap-5 p-6 sm:p-8">
        <div className="space-y-2">
          <p className="text-sm text-ink-muted">Total value</p>
          <p className="text-4xl font-semibold tracking-tight tabular-nums text-ink">
            {formatUsd(totalValueUsd)}
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <ReturnValue value={dayChangePct} />
            <span className="text-sm text-ink-muted">past 24 hours</span>
          </div>
        </div>

        <dl className="flex flex-wrap gap-x-8 gap-y-3 border-t border-line pt-4">
          <div>
            <dt className="text-xs text-ink-subtle">Holdings</dt>
            <dd className="mt-0.5 text-sm font-medium tabular-nums text-ink">
              {holdingCount}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-ink-subtle">Wallet</dt>
            <dd className="mt-0.5 font-mono text-sm text-ink">
              {address ? truncateAddress(address) : "Not connected"}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-ink-subtle">Network</dt>
            <dd className="mt-0.5 text-sm font-medium text-ink">
              {SITE.network}
            </dd>
          </div>
        </dl>
      </div>
    </section>
  );
};
