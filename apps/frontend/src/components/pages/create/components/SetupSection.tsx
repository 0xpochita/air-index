"use client";

import { CaretDownIcon, type Icon } from "@phosphor-icons/react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type SectionStatus = "in-progress" | "complete" | "incomplete";

const STATUS_LABEL: Record<SectionStatus, string> = {
  "in-progress": "In progress",
  complete: "Complete",
  incomplete: "Incomplete",
};

const STATUS_CLASS: Record<SectionStatus, string> = {
  "in-progress": "bg-[oklch(0.95_0.06_85)] text-[oklch(0.48_0.12_75)]",
  complete: "bg-positive/15 text-positive",
  incomplete: "bg-surface-subtle text-ink-subtle",
};

interface SetupSectionProps {
  icon: Icon;
  title: string;
  description: string;
  status: SectionStatus;
  isOpen: boolean;
  onToggle: () => void;
  children: ReactNode;
}

/**
 * One step of the setup. Collapsed it is a summary row; open it holds the
 * fields. Both states keep the same header, so opening a step does not move
 * the ones below it further than the panel it reveals.
 */
export const SetupSection = ({
  icon: SectionIcon,
  title,
  description,
  status,
  isOpen,
  onToggle,
  children,
}: SetupSectionProps) => (
  <section className="border-t border-line pt-5 first:border-t-0 first:pt-0">
    <div className="flex items-center gap-3.5">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-full border border-line bg-surface text-ink-muted">
        <SectionIcon size={17} aria-hidden />
      </span>

      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-ink">{title}</span>
        <span className="block truncate text-xs text-ink-muted">
          {description}
        </span>
      </span>

      <span
        className={cn(
          "hidden shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium sm:block",
          STATUS_CLASS[status],
        )}
      >
        {STATUS_LABEL[status]}
      </span>

      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        className={cn(
          "flex size-8 shrink-0 items-center justify-center rounded-full transition-colors duration-150 ease-out",
          isOpen
            ? "bg-ink text-ink-inverse"
            : "border border-line bg-surface text-ink-muted hover:text-ink",
        )}
      >
        <CaretDownIcon
          size={13}
          weight="bold"
          aria-hidden
          className={cn(
            "transition-transform duration-150 ease-out",
            isOpen && "rotate-180",
          )}
        />
        <span className="sr-only">{`${isOpen ? "Collapse" : "Expand"} ${title}`}</span>
      </button>
    </div>

    {isOpen ? <div className="mt-4">{children}</div> : null}
  </section>
);
