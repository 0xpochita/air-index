import Image from "next/image";
import { ButtonLink } from "@/components/ui/Button";
import { GlowButton } from "@/components/ui/glow-button";
import { ReturnValue } from "@/components/ui/ReturnValue";
import { SITE } from "@/config/site";
import { formatUsd } from "@/lib/format";

const IMAGE_QUALITY = 90;
const IMAGE_FADE = "linear-gradient(to right, transparent 0%, black 60%)";

interface PortfolioHeroProps {
  totalValueUsd: number;
  dayChangePct: number;
  indexCount: number;
}

export const PortfolioHero = ({
  totalValueUsd,
  dayChangePct,
  indexCount,
}: PortfolioHeroProps) => (
  <section className="relative isolate min-h-48 overflow-hidden rounded-xl border border-canvas/70 bg-surface/72 shadow-glass backdrop-blur-xl">
    <div
      aria-hidden
      style={{ maskImage: IMAGE_FADE, WebkitMaskImage: IMAGE_FADE }}
      className="pointer-events-none absolute inset-y-0 right-0 w-3/5 opacity-70 sm:w-1/2 lg:w-2/5"
    >
      <Image
        src="/assets/flowers-bg.jpg"
        alt=""
        fill
        priority
        quality={IMAGE_QUALITY}
        sizes="(max-width: 640px) 60vw, (max-width: 1024px) 50vw, 460px"
        className="object-cover object-center"
      />
    </div>

    <div className="relative flex max-w-lg flex-col gap-4 p-6">
      <div className="space-y-1.5">
        <p className="text-sm text-ink-muted">Portfolio value</p>
        <p className="text-3xl font-semibold tracking-tight tabular-nums text-ink">
          {formatUsd(totalValueUsd)}
        </p>
        <div className="flex flex-wrap items-center gap-2 text-sm text-ink-muted">
          <ReturnValue value={dayChangePct} />
          <span>past 24 hours</span>
          <span aria-hidden>·</span>
          <span>{indexCount === 1 ? "1 index" : `${indexCount} indexes`}</span>
          <span aria-hidden>·</span>
          <span>{SITE.network}</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <GlowButton href="/explore" label="Explore indexes" />
        <ButtonLink href="/create" variant="secondary">
          Create an index
        </ButtonLink>
      </div>
    </div>
  </section>
);
