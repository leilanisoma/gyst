"use client";

import { useState } from "react";
import { motion } from "motion/react";

import { growthStage } from "@/lib/gamification";
import { SPRINGS, prefersReducedMotion } from "@/lib/motion";

const LEAF_PATHS = [
  "M0,0 C10,-14 22,-14 26,-2 C18,-4 8,-2 0,0 Z",
  "M0,0 C-10,-14 -22,-14 -26,-2 C-18,-4 -8,-2 0,0 Z",
  "M0,0 C10,-16 24,-16 28,-4 C20,-6 8,-4 0,0 Z",
  "M0,0 C-10,-16 -24,-16 -28,-4 C-20,-6 -8,-4 0,0 Z",
];

/**
 * Ambient room-growth visual (Phase 9D §13) replacing the numeric XP/
 * "days engaged" readout — same `xp_events` data, display only. A little
 * plant that grows a leaf per stage and brightens with this week's
 * consistency, instead of a count anyone could optimize.
 */
export function XpGrowthVisual({
  xp,
  daysEngaged,
}: {
  xp: number;
  daysEngaged: number;
}) {
  const [reduceMotion] = useState(() => prefersReducedMotion());
  const stage = growthStage(xp);
  const leafCount = Math.max(0, stage - 1);
  const brightness = 0.75 + (daysEngaged / 7) * 0.4;

  return (
    <div
      role="img"
      aria-label={`Growing steadily — ${xp} XP, ${daysEngaged} of 7 days engaged this week`}
      title={`${xp} XP · ${daysEngaged}/7 days this week`}
      className="inline-block"
      style={{ filter: `brightness(${brightness})` }}
    >
      <svg viewBox="-40 -50 80 58" width={40} height={30}>
        <motion.line
          x1={0}
          y1={8}
          x2={0}
          y2={0}
          stroke="var(--primary)"
          strokeWidth={2.5}
          strokeLinecap="round"
          animate={{ y2: stage === 0 ? 6 : -stage * 4 }}
          transition={reduceMotion ? { duration: 0 } : SPRINGS.gentle}
        />
        {LEAF_PATHS.slice(0, leafCount).map((path, i) => (
          <motion.g key={i} style={{ x: 0, y: -4 - i * 10 }}>
            <motion.path
              d={path}
              fill="var(--chart-2)"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={reduceMotion ? { duration: 0 } : SPRINGS.gentle}
              style={{ transformOrigin: "0px 0px" }}
            />
          </motion.g>
        ))}
        {stage >= 4 && (
          <motion.circle
            cx={0}
            cy={-stage * 4 - 4}
            r={4}
            fill="var(--accent)"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={reduceMotion ? { duration: 0 } : SPRINGS.gentle}
          />
        )}
      </svg>
    </div>
  );
}
