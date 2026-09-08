import Image from "next/image";
import { SITE } from "@/config/site";

const IMAGE_QUALITY = 90;

const STEPS = [
  "Name the index and it becomes an ENS name",
  "Each constituent is published as a subname",
  "Lock the methodology so nobody can rewrite it",
];

export const CreateHero = () => (
  <section className="grid overflow-hidden rounded-xl border border-line bg-surface sm:grid-cols-[11rem_minmax(0,1fr)]">
    <div className="relative isolate hidden min-h-52 sm:block">
      <Image
        src="/assets/cat-ui-bg-3.jpg"
        alt=""
        fill
        priority
        quality={IMAGE_QUALITY}
        sizes="11rem"
        className="object-cover object-center"
      />
    </div>

    <div className="flex flex-col justify-center gap-4 p-6 sm:p-7">
      <div className="space-y-1.5">
        <h1 className="text-2xl font-semibold tracking-tight text-ink">
          Create an index
        </h1>
        <p className="text-sm text-ink-muted">
          Composition lives in the namespace, not a database. Anyone can read it
          back with a standard ENS library.
        </p>
      </div>

      <ol className="space-y-1.5">
        {STEPS.map((step, position) => (
          <li
            key={step}
            className="flex items-center gap-2.5 text-sm text-ink-muted"
          >
            <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-surface-hover text-xs font-semibold text-ink">
              {position + 1}
            </span>
            {step}
          </li>
        ))}
      </ol>

      <p className="font-mono text-xs text-ink-subtle">{`your-index.${SITE.protocolRoot}`}</p>
    </div>
  </section>
);
