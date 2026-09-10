"use client";

import { ArrowSquareOutIcon } from "@phosphor-icons/react/dist/ssr";
import { motion } from "motion/react";
import type { ReactNode } from "react";
import { CopyButton } from "@/components/ui/CopyButton";
import type { ResolvedName } from "@/lib/ens/resolve";
import { truncateAddress } from "@/lib/format";

const EXPLORER_ADDRESS = "https://sepolia.etherscan.io/address/";

/** Rows arrive one after another, so a long record list reads as it lands. */
const ROW = {
  hidden: { opacity: 0, y: 6 },
  visible: (index: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.03 * index, duration: 0.2 },
  }),
} as const;

const Row = ({
  label,
  index,
  children,
}: {
  label: string;
  index: number;
  children: ReactNode;
}) => (
  <motion.div
    variants={ROW}
    initial="hidden"
    animate="visible"
    custom={index}
    className="flex items-start justify-between gap-4 border-t border-line py-2.5 first:border-t-0"
  >
    <dt className="shrink-0 font-mono text-xs text-ink-subtle">{label}</dt>
    <dd className="min-w-0 text-right">{children}</dd>
  </motion.div>
);

const AddressLink = ({ address }: { address: `0x${string}` }) => (
  <a
    href={`${EXPLORER_ADDRESS}${address}`}
    target="_blank"
    rel="noreferrer"
    className="inline-flex items-center gap-1.5 font-mono text-xs text-ink transition-colors duration-150 ease-out hover:text-accent"
  >
    {truncateAddress(address)}
    <ArrowSquareOutIcon size={11} aria-hidden />
  </a>
);

interface ResolveResultProps {
  result: ResolvedName;
}

export const ResolveResult = ({ result }: ResolveResultProps) => {
  const hasRecords = Boolean(result.address) || result.records.length > 0;
  let row = 0;

  return (
    <div className="space-y-5">
      <section>
        <h3 className="mb-1 text-xs font-semibold text-ink">Records</h3>
        {hasRecords ? (
          <dl>
            {result.address ? (
              <Row label="addr(60)" index={row++}>
                <AddressLink address={result.address} />
              </Row>
            ) : null}
            {result.records.map((record) => (
              <Row
                key={record.key}
                label={`text("${record.key}")`}
                index={row++}
              >
                <span className="text-sm break-words text-ink">
                  {record.value}
                </span>
              </Row>
            ))}
          </dl>
        ) : (
          <p className="py-4 text-sm text-ink-muted">
            Nothing resolves at this name.
          </p>
        )}
      </section>

      <section>
        <h3 className="mb-1 text-xs font-semibold text-ink">How it resolved</h3>
        <dl>
          <Row label="resolver" index={row++}>
            {result.resolver ? (
              <AddressLink address={result.resolver} />
            ) : (
              <span className="text-xs text-ink-muted">none found</span>
            )}
          </Row>

          {result.registration?.kind === "entry" ? (
            <Row
              label={`findOwner("${result.registration.label}")`}
              index={row++}
            >
              <AddressLink address={result.registration.owner} />
            </Row>
          ) : null}

          {result.registration?.kind === "wildcard" ? (
            <Row label="registry entry" index={row++}>
              <span className="text-xs font-medium text-accent">
                none — {result.registration.parent} lends no subregistry, so
                &quot;{result.registration.label}&quot; cannot be registered
                anywhere
              </span>
            </Row>
          ) : null}

          {result.registration?.kind === "unregistered" ? (
            <Row
              label={`findOwner("${result.registration.label}")`}
              index={row++}
            >
              <span className="text-xs text-ink-muted">
                0x0 — not registered
              </span>
            </Row>
          ) : null}

          <Row label="namehash" index={row++}>
            <span className="inline-flex items-center gap-1">
              <span className="font-mono text-[11px] break-all text-ink-muted">
                {result.namehash}
              </span>
              <CopyButton value={result.namehash} label="Copy namehash" />
            </span>
          </Row>

          <Row label="dns-encoded" index={row++}>
            <span className="inline-flex items-center gap-1">
              <span className="font-mono text-[11px] break-all text-ink-muted">
                {result.dnsEncoded}
              </span>
              <CopyButton value={result.dnsEncoded} label="Copy DNS encoding" />
            </span>
          </Row>
        </dl>
      </section>
    </div>
  );
};
