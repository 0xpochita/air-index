"use client";

import {
  ArrowSquareOutIcon,
  CheckCircleIcon,
} from "@phosphor-icons/react/dist/ssr";
import { useEffect, useRef } from "react";
import { truncateAddress } from "@/lib/format";

const EXPLORER_TX = "https://sepolia.etherscan.io/tx/";

interface TxSuccessDialogProps {
  /** Non-null opens the dialog. Clearing it in the parent closes it. */
  hash: `0x${string}` | null;
  title: string;
  detail?: string | null;
  onDismiss: () => void;
}

export const TxSuccessDialog = ({
  hash,
  title,
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
      <div className="flex flex-col items-center gap-4 px-6 pt-8 pb-6 text-center">
        <CheckCircleIcon
          size={44}
          weight="fill"
          aria-hidden
          className="text-positive"
        />

        <div className="space-y-1">
          <h2
            id="tx-success-title"
            className="text-base font-semibold text-ink"
          >
            {title}
          </h2>
          {detail ? <p className="text-sm text-ink-muted">{detail}</p> : null}
        </div>

        {hash ? (
          <a
            href={`${EXPLORER_TX}${hash}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 rounded-full bg-surface-subtle px-3 py-1.5 font-mono text-xs text-ink-muted transition-colors duration-150 ease-out hover:text-accent"
          >
            {truncateAddress(hash)}
            <ArrowSquareOutIcon size={12} aria-hidden />
          </a>
        ) : null}

        <button
          type="button"
          onClick={onDismiss}
          className="mt-1 w-full rounded-md bg-accent px-4 py-2.5 text-sm font-medium text-ink-inverse transition-colors duration-150 ease-out hover:bg-accent-hover"
        >
          Done
        </button>
      </div>
    </dialog>
  );
};
