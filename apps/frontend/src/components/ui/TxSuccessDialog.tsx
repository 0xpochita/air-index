"use client";

import { ArrowSquareOutIcon, CheckIcon } from "@phosphor-icons/react/dist/ssr";
import { type ReactNode, useEffect, useRef } from "react";
import { truncateAddress } from "@/lib/format";

const EXPLORER_TX = "https://sepolia.etherscan.io/tx/";

interface TxSuccessDialogProps {
  /** Non-null opens the dialog. Clearing it in the parent closes it. */
  hash: `0x${string}` | null;
  title: string;
  /** The asset the transaction produced — a token stack, or a single icon. */
  icon?: ReactNode;
  ensName?: string | null;
  detail?: string | null;
  onDismiss: () => void;
}

export const TxSuccessDialog = ({
  hash,
  title,
  icon,
  ensName,
  detail,
  onDismiss,
}: TxSuccessDialogProps) => {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;

    if (!dialog) {
      return;
    }

    if (hash && !dialog.open) {
      dialog.showModal();
    }

    if (!hash && dialog.open) {
      dialog.close();
    }
  }, [hash]);

  return (
    <dialog
      ref={dialogRef}
      onClose={onDismiss}
      aria-labelledby="tx-success-title"
      className="m-auto w-[calc(100%-2rem)] max-w-sm rounded-xl border border-line bg-surface p-0 text-ink shadow-floating backdrop:bg-ink/40"
    >
      <div className="flex flex-col items-center gap-5 px-6 pt-8 pb-6 text-center">
        {/* The asset carries the confirmation, so the tick is a badge on it. */}
        <span className="relative inline-flex">
          {icon}
          <span className="absolute -right-1.5 -bottom-1.5 flex size-6 items-center justify-center rounded-full bg-positive ring-3 ring-surface">
            <CheckIcon
              size={13}
              weight="bold"
              aria-hidden
              className="text-ink-inverse"
            />
          </span>
        </span>

        <div className="space-y-1">
          <h2
            id="tx-success-title"
            className="text-base font-semibold text-ink"
          >
            {title}
          </h2>
          {ensName ? (
            <p className="font-mono text-sm text-ink-muted">{ensName}</p>
          ) : null}
        </div>

        {detail ? (
          <p className="w-full rounded-lg bg-surface-subtle px-4 py-3 text-sm font-medium tabular-nums text-ink">
            {detail}
          </p>
        ) : null}

        {hash ? (
          <a
            href={`${EXPLORER_TX}${hash}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 font-mono text-xs text-ink-subtle transition-colors duration-150 ease-out hover:text-accent"
          >
            {truncateAddress(hash)}
            <ArrowSquareOutIcon size={12} aria-hidden />
          </a>
        ) : null}

        <button
          type="button"
          onClick={onDismiss}
          className="w-full rounded-md bg-accent px-4 py-2.5 text-sm font-medium text-ink-inverse transition-colors duration-150 ease-out hover:bg-accent-hover"
        >
          Done
        </button>
      </div>
    </dialog>
  );
};
