"use client";

import { ArrowSquareOutIcon, CheckIcon } from "@phosphor-icons/react/dist/ssr";
import { AnimatePresence, motion } from "motion/react";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { truncateAddress } from "@/lib/format";

const EXPLORER_TX = "https://sepolia.etherscan.io/tx/";

const PANEL = {
  hidden: { opacity: 0, scale: 0.94, y: 12 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: "spring", stiffness: 420, damping: 32, mass: 0.7 },
  },
  exit: { opacity: 0, scale: 0.97, y: 6, transition: { duration: 0.12 } },
} as const;

/** The asset lands first, then the tick punches in on top of it. */
const ASSET = {
  hidden: { opacity: 0, scale: 0.7 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { delay: 0.05, type: "spring", stiffness: 380, damping: 20 },
  },
} as const;

const TICK = {
  hidden: { opacity: 0, scale: 0 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { delay: 0.22, type: "spring", stiffness: 600, damping: 18 },
  },
} as const;

const BODY = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { delay: 0.14, duration: 0.22 } },
} as const;

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
  const [isVisible, setIsVisible] = useState(false);

  /**
   * The dialog element opens immediately so the browser keeps the top layer,
   * the focus trap and Escape. Only its contents animate, and the close is held
   * back until the exit finishes — `close()` would otherwise cut the frame.
   */
  useEffect(() => {
    if (hash) {
      dialogRef.current?.showModal();
      setIsVisible(true);
      return;
    }

    setIsVisible(false);
  }, [hash]);

  return (
    <dialog
      ref={dialogRef}
      onClose={onDismiss}
      onCancel={(event) => {
        event.preventDefault();
        setIsVisible(false);
      }}
      aria-labelledby="tx-success-title"
      className="m-auto w-[calc(100%-2rem)] max-w-sm bg-transparent p-0 text-ink backdrop:bg-ink/40 backdrop:backdrop-blur-sm"
    >
      <AnimatePresence onExitComplete={() => dialogRef.current?.close()}>
        {isVisible ? (
          <motion.div
            variants={PANEL}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="flex flex-col items-center gap-5 rounded-xl border border-line bg-surface px-6 pt-8 pb-6 text-center shadow-floating"
          >
            <motion.span variants={ASSET} className="relative inline-flex">
              {icon}
              <motion.span
                variants={TICK}
                className="absolute -right-1.5 -bottom-1.5 flex size-6 items-center justify-center rounded-full bg-positive ring-3 ring-surface"
              >
                <CheckIcon
                  size={13}
                  weight="bold"
                  aria-hidden
                  className="text-ink-inverse"
                />
              </motion.span>
            </motion.span>

            <motion.div
              variants={BODY}
              className="flex w-full flex-col items-center gap-5"
            >
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
                onClick={() => setIsVisible(false)}
                className="w-full rounded-md bg-accent px-4 py-2.5 text-sm font-medium text-ink-inverse transition-colors duration-150 ease-out hover:bg-accent-hover"
              >
                Done
              </button>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </dialog>
  );
};
