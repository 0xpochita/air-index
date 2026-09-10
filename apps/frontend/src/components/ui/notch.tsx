import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * The wings are what sell a notch. Each paints the notch's own colour into the
 * square beside it, minus a quarter circle, so the gap between the notch and
 * the page edge reads as a concave curve rather than a hard corner.
 *
 * They only work against an opaque notch, and only when it contrasts with the
 * page: a white notch on a white page has nothing to curve out of.
 */
const WING_CLASS =
  "pointer-events-none absolute top-0 size-4 overflow-visible select-none text-ink";

export const NotchLeftWing = ({ className }: { className?: string }) => (
  <svg
    aria-hidden
    role="presentation"
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
    shapeRendering="geometricPrecision"
    className={cn(WING_CLASS, "right-full", className)}
  >
    <path
      d="M 0 0 C 11.046 0 20 8.954 20 20 H 21 V -1 H 0 Z"
      fill="currentColor"
    />
  </svg>
);

export const NotchRightWing = ({ className }: { className?: string }) => (
  <svg
    aria-hidden
    role="presentation"
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
    shapeRendering="geometricPrecision"
    className={cn(WING_CLASS, "left-full", className)}
  >
    <path
      d="M 20 0 C 8.954 0 0 8.954 0 20 H -1 V -1 H 20 Z"
      fill="currentColor"
    />
  </svg>
);

interface NotchProps {
  children: ReactNode;
  className?: string;
}

/** One island hanging off the top edge, curved into the page on both sides. */
export const Notch = ({ children, className }: NotchProps) => (
  <div
    className={cn(
      "relative flex items-center rounded-b-[22px] bg-ink",
      className,
    )}
  >
    <NotchLeftWing />
    {children}
    <NotchRightWing />
  </div>
);
