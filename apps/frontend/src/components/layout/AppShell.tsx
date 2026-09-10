"use client";

import { MotionConfig } from "motion/react";
import type { ReactNode } from "react";
import { Navbar } from "./Navbar";

interface AppShellProps {
  children: ReactNode;
}

export const AppShell = ({ children }: AppShellProps) => (
  /**
   * The reduced-motion rule in globals.css only reaches CSS. Motion animates in
   * JS, so it has to be told separately or the preference is silently ignored.
   */
  <MotionConfig reducedMotion="user">
    <div className="min-h-dvh">
      <Navbar />
      <main className="mx-auto w-full max-w-6xl px-4 pt-10 pb-8 lg:px-8">
        {children}
      </main>
    </div>
  </MotionConfig>
);
