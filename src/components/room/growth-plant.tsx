"use client";

import { useState } from "react";
import { motion } from "motion/react";

import { SPRINGS, prefersReducedMotion } from "@/lib/motion";

const LEAF_PATHS = [
  "M0,0 C10,-14 22,-14 26,-2 C18,-4 8,-2 0,0 Z",
  "M0,0 C-10,-14 -22,-14 -26,-2 C-18,-4 -8,-2 0,0 Z",
  "M0,0 C10,-16 24,-16 28,-4 C20,-6 8,-4 0,0 Z",
  "M0,0 C-10,-16 -24,-16 -28,-4 C-20,-6 -8,-4 0,0 Z",
];

/**
 * Ambient "growing plant" visual (Phase 9D §13) — a stem that grows a leaf
 * per stage and brightens with recent consistency, instead of a number
 * anyone could optimize. Originally the Today hub's XP visual
 * (`XpGrowthVisual`, still the only caller that computes `stage`/
 * `brightness` from `xp_events`); extracted here so the Wellness room
 * (Phase 9D-2) can reuse the same rendering fed by check-in consistency
 * instead, without duplicating the SVG/motion code.
 */
export function GrowthPlant({
  stage,
  brightness,
  ariaLabel,
  title,
  size = 1,
  pot = false,
  leafColor = "var(--chart-2)",
}: {
  stage: number;
  brightness: number;
  ariaLabel: string;
  title: string;
  size?: number;
  /** Draws a small terracotta pot under the stem, so the visual still reads
   * as "an object" at stage 0 (bare stem, no leaves yet) instead of
   * vanishing against a busy background — for room placements where it's
   * the only decoration (e.g. the Wellness greenhouse), not the hub's
   * inline usage next to other UI. */
  pot?: boolean;
  /** Defaults to the hub's original color (`--chart-2`, blue-ish — invisible
   * at the hub's small inline scale, unchanged so as not to alter existing
   * behavior there). Callers rendering this larger/standalone should pass
   * an actually-green token, e.g. `--chart-1`. */
  leafColor?: string;
}) {
  const [reduceMotion] = useState(() => prefersReducedMotion());
  const leafCount = Math.max(0, stage - 1);

  return (
    <div
      role="img"
      aria-label={ariaLabel}
      title={title}
      className="inline-flex flex-col items-center"
      style={{ filter: `brightness(${brightness})` }}
    >
      <svg viewBox="-40 -50 80 58" width={40 * size} height={30 * size}>
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
              fill={leafColor}
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
      {pot && (
        <svg
          viewBox="0 0 40 26"
          width={40 * size}
          height={26 * size}
          style={{ marginTop: -4 * size }}
        >
          <ellipse cx={20} cy={3} rx={17} ry={3.5} fill="#8b4e2b" />
          <path d="M4,3 L36,3 L31,24 L9,24 Z" fill="#c07a4a" />
          <path d="M4,3 L36,3 L34.5,9 L5.5,9 Z" fill="#a8632f" />
        </svg>
      )}
    </div>
  );
}
