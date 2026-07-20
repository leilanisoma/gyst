"use client";

import { AnimatePresence, motion } from "motion/react";
import {
  BookOpen,
  Briefcase,
  Moon,
  Sparkles,
  Swords,
  type LucideIcon,
} from "lucide-react";
import { useState } from "react";

import { COMPANION_STATE_LABELS, type CompanionState } from "@/lib/companion";
import { SPRINGS, prefersReducedMotion } from "@/lib/motion";
import { cn } from "@/lib/utils";

type StateConfig = {
  /** Vertical squash on the eyes — 1 is neutral, <1 sleepy, >1 wide/alert. */
  eyeScaleY: number;
  mouth: "smile" | "flat" | "small" | "open";
  icon?: LucideIcon;
  /** CSS color value (var(...) into an existing theme token — no new hexes). */
  accent: string;
};

const STATE_CONFIG: Record<CompanionState, StateConfig> = {
  idle: { eyeScaleY: 1, mouth: "flat", accent: "var(--muted-foreground)" },
  focused: {
    eyeScaleY: 0.85,
    mouth: "small",
    icon: Sparkles,
    accent: "var(--primary)",
  },
  studying: {
    eyeScaleY: 0.8,
    mouth: "flat",
    icon: BookOpen,
    accent: "var(--chart-4)",
  },
  fencing: {
    eyeScaleY: 1.15,
    mouth: "open",
    icon: Swords,
    accent: "var(--chart-3)",
  },
  recruiting: {
    eyeScaleY: 1,
    mouth: "smile",
    icon: Briefcase,
    accent: "var(--chart-2)",
  },
  resting: {
    eyeScaleY: 0.3,
    mouth: "flat",
    icon: Moon,
    accent: "var(--secondary-foreground)",
  },
};

const MOUTH_PATHS: Record<StateConfig["mouth"], string> = {
  smile: "M78,118 Q100,138 122,118",
  flat: "M82,120 L118,120",
  small: "M90,118 Q100,124 110,118",
  open: "M92,112 a8,10 0 1,0 16,0 a8,10 0 1,0 -16,0",
};

/** The blob body — a hand-drawn organic outline, not a plain circle. */
const BLOB_PATH =
  "M60,14 C100,4 148,18 168,54 C186,86 178,132 148,160 C118,188 68,190 38,164 C10,140 4,96 18,62 C28,38 40,22 60,14 Z";

export function CompanionBlob({
  state,
  size = 112,
  showLabel = true,
  className,
}: {
  state: CompanionState;
  size?: number;
  showLabel?: boolean;
  className?: string;
}) {
  const [reduceMotion] = useState(() => prefersReducedMotion());

  const config = STATE_CONFIG[state];
  const Icon = config.icon;

  return (
    <div
      className={cn("inline-flex flex-col items-center gap-1.5", className)}
      role="img"
      aria-label={`Companion is ${COMPANION_STATE_LABELS[state]}`}
    >
      <motion.svg
        viewBox="0 0 200 200"
        width={size}
        height={size}
        animate={
          reduceMotion ? undefined : { y: [0, -5, 0], scaleY: [1, 1.03, 1] }
        }
        transition={
          reduceMotion
            ? undefined
            : {
                duration: 2.6,
                repeat: Infinity,
                repeatType: "mirror",
                ease: "easeInOut",
              }
        }
        style={{ transformOrigin: "center" }}
      >
        <motion.path
          d={BLOB_PATH}
          fill="var(--primary)"
          animate={{ fill: config.accent }}
          transition={SPRINGS.gentle}
        />

        <AnimatePresence mode="wait">
          <motion.g
            key={state}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={SPRINGS.gentle}
            style={{ transformOrigin: "100px 110px" }}
          >
            <motion.ellipse
              cx="76"
              cy="96"
              rx="7"
              ry="9"
              fill="var(--card)"
              animate={{ scaleY: config.eyeScaleY }}
              transition={SPRINGS.gentle}
              style={{ transformOrigin: "76px 96px" }}
            />
            <motion.ellipse
              cx="124"
              cy="96"
              rx="7"
              ry="9"
              fill="var(--card)"
              animate={{ scaleY: config.eyeScaleY }}
              transition={SPRINGS.gentle}
              style={{ transformOrigin: "124px 96px" }}
            />
            <path
              d={MOUTH_PATHS[config.mouth]}
              stroke="var(--card)"
              strokeWidth={5}
              strokeLinecap="round"
              fill="none"
            />
          </motion.g>
        </AnimatePresence>
      </motion.svg>

      {showLabel && Icon && (
        <motion.div
          key={`icon-${state}`}
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={SPRINGS.gentle}
          className="text-muted-foreground flex items-center gap-1 text-xs"
        >
          <Icon className="size-3.5" aria-hidden="true" />
          <span>{COMPANION_STATE_LABELS[state]}</span>
        </motion.div>
      )}
      {showLabel && !Icon && (
        <span className="text-muted-foreground text-xs">
          {COMPANION_STATE_LABELS[state]}
        </span>
      )}
    </div>
  );
}
