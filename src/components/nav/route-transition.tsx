"use client";

import { AnimatePresence, motion } from "motion/react";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { DURATIONS, EASINGS } from "@/lib/motion";

/** Fades/lifts route content in on navigation instead of an abrupt swap (Phase 9C). */
export function RouteTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={{ duration: DURATIONS.base, ease: EASINGS.out }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
