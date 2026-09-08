import Image from "next/image";

const IMAGE_QUALITY = 90;

const STEPS = [
  "Name it, get an ENS name",
  "Constituents become subnames",
  "Lock the methodology",
];

export const CreateHero = () => (
  <section className="grid overflow-hidden rounded-xl border border-line bg-surface sm:grid-cols-[9rem_minmax(0,1fr)]">
    <div className="relative isolate hidden min-h-36 sm:block">
      <Image
        src="/assets/cat-ui-bg-3.jpg"
        alt=""
        fill
        priority
        quality={IMAGE_QUALITY}
        sizes="9rem"
        className="object-cover object-center"
      />
    </div>

    <div className="flex flex-col justify-center gap-3 p-5">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight text-ink">
          Create an index
        </h1>
        <p className="text-sm text-ink-muted">
          Composition lives in the namespace, not a database. Anyone can read it
          back with a standard ENS library.
        </p>
      </div>

      <ol className="flex flex-wrap gap-x-5 gap-y-1.5">
        {STEPS.map((step, position) => (
          <li
            key={step}
            className="flex items-center gap-2 text-xs text-ink-muted"
          >
            <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-surface-hover text-[10px] font-semibold text-ink">
              {position + 1}
            </span>
            {step}
          </li>
        ))}
      </ol>
    </div>
  </section>
);
