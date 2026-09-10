"use client";

import { MagnifyingGlassIcon, XIcon } from "@phosphor-icons/react/dist/ssr";
import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/cn";
import { type ResolvedName, resolveName } from "@/lib/ens/resolve";
import { ResolveResult } from "./ResolveResult";

const PANEL = {
  hidden: { opacity: 0, scale: 0.95, y: 14 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: "spring", stiffness: 420, damping: 32, mass: 0.7 },
  },
  exit: { opacity: 0, scale: 0.97, y: 8, transition: { duration: 0.12 } },
} as const;

interface ResolveNameButtonProps {
  name: string;
  className?: string;
  size?: number;
}

/**
 * Resolves a name where it is written, rather than sending someone to another
 * page to retype it. The lookup runs when the dialog opens, so names nobody
 * asks about cost nothing.
 */
export const ResolveNameButton = ({
  name,
  className,
  size = 13,
}: ResolveNameButtonProps) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  /**
   * Mounted on first open and left mounted afterwards, because AnimatePresence
   * needs the element to survive its own exit animation.
   */
  const [isMounted, setIsMounted] = useState(false);
  const [result, setResult] = useState<ResolvedName | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    dialogRef.current?.showModal();

    let cancelled = false;
    setResult(null);
    setError(null);

    resolveName(name)
      .then((resolved) => {
        if (!cancelled) {
          setResult(resolved);
        }
      })
      .catch((cause) => {
        if (!cancelled) {
          setError(
            cause instanceof Error ? cause.message : "Could not resolve.",
          );
        }
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, name]);

  /**
   * Rendered into the body, not inline. The trigger sits beside a name inside a
   * <p> or a <span>, and a <dialog> is flow content — nesting it there is
   * invalid HTML, which React reports as a hydration mismatch.
   */
  const dialog = (
    <dialog
      ref={dialogRef}
      onClose={() => setIsOpen(false)}
      onCancel={(event) => {
        event.preventDefault();
        setIsOpen(false);
      }}
      aria-label={`Resolution of ${name}`}
      className="m-auto w-[calc(100%-2rem)] max-w-lg bg-transparent p-0 text-ink backdrop:bg-ink/40 backdrop:backdrop-blur-sm"
    >
      <AnimatePresence onExitComplete={() => dialogRef.current?.close()}>
        {isOpen ? (
          <motion.div
            variants={PANEL}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="max-h-[80vh] overflow-y-auto rounded-3xl border border-line bg-surface p-6 shadow-floating"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex min-w-0 items-center gap-3">
                <Image
                  src="/tokens/ens.png"
                  alt=""
                  width={36}
                  height={36}
                  className="size-9 shrink-0 rounded-full"
                />
                <div className="min-w-0">
                  <p className="text-xs text-ink-subtle">
                    Resolved through the
                  </p>
                  <p className="text-sm font-semibold text-ink">
                    ENS Universal Resolver
                  </p>
                  <p className="mt-0.5 truncate font-mono text-xs text-ink-muted">
                    {name}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="shrink-0 rounded-md p-1 text-ink-subtle transition-colors duration-150 ease-out hover:bg-surface-hover hover:text-ink"
              >
                <XIcon size={16} aria-hidden />
                <span className="sr-only">Close</span>
              </button>
            </div>

            <div className="mt-5 border-t border-line pt-4">
              {error ? (
                <p className="text-sm text-negative">{error}</p>
              ) : result ? (
                <ResolveResult result={result} />
              ) : (
                <p className="py-6 text-center text-sm text-ink-muted">
                  Reading records…
                </p>
              )}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </dialog>
  );

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setIsMounted(true);
          setIsOpen(true);
        }}
        title={`Resolve ${name}`}
        className={cn(
          "rounded-md p-1 text-ink-subtle transition-colors duration-150 ease-out hover:bg-surface-hover hover:text-accent",
          className,
        )}
      >
        <MagnifyingGlassIcon size={size} aria-hidden />
        <span className="sr-only">{`Resolve ${name}`}</span>
      </button>

      {isMounted ? createPortal(dialog, document.body) : null}
    </>
  );
};
