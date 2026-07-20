/**
 * Shared motion vocabulary (Phase 9C) — the durations, easings, and spring
 * configs every animated surface should reuse, so hover states, page
 * transitions, and the companion all move with the same "cozy" feel instead
 * of each picking their own timing. Mirrors the `--motion-*` custom
 * properties in `globals.css` (kept in sync by hand: CSS drives plain
 * Tailwind transitions, these constants drive `motion/react`).
 */

export const DURATIONS = {
  fast: 0.15,
  base: 0.25,
  slow: 0.4,
} as const;

/** Cubic-bezier easings, expressed as `motion`-compatible arrays. */
export const EASINGS = {
  standard: [0.4, 0, 0.2, 1] as const,
  out: [0, 0, 0.2, 1] as const,
  in: [0.4, 0, 1, 1] as const,
};

/** Spring presets for `motion/react`'s `type: "spring"` transitions. */
export const SPRINGS = {
  /** Snappy — hover/press micro-interactions on buttons, cards, inputs. */
  snappy: { type: "spring" as const, stiffness: 420, damping: 28, mass: 0.6 },
  /** Gentle — the companion's idle bob and state changes. */
  gentle: { type: "spring" as const, stiffness: 160, damping: 20, mass: 0.9 },
};

/** Shared hover/press scale values for interactive primitives. */
export const PRESS_SCALE = {
  hover: 1.03,
  press: 0.97,
};

/** Respects the user's OS-level motion preference; skip decorative animation when true. */
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Hover/press motion for room doorways and ambient scene objects (Phase
 * 9D) — a lift plus a soft glow in the object's own accent color, shared so
 * every clickable "thing in the room" (doorway, journal, thermostat) reads
 * as the same kind of object. `accent` is a CSS color value (a theme var
 * like `"var(--chart-2)"`, not a new hex).
 */
export function roomObjectMotionProps(accent: string) {
  const restShadow = "0 0 0 1px transparent, 0 10px 24px -8px transparent";
  const hoverShadow = `0 0 0 1px ${accent}, 0 16px 32px -8px ${accent}`;

  return {
    initial: { boxShadow: restShadow },
    whileHover: { scale: PRESS_SCALE.hover, boxShadow: hoverShadow },
    whileTap: { scale: PRESS_SCALE.press },
    transition: SPRINGS.snappy,
  } as const;
}

/**
 * Hover/press motion for chrome-less floating objects directly on the room
 * art (Phase 9D, 2026-07-20) — a lift plus a soft glow via `drop-shadow`
 * filter instead of `roomObjectMotionProps`' `box-shadow`, since there's no
 * card box left to put a box-shadow on.
 */
export function floatingObjectMotionProps(accent: string) {
  return {
    initial: { filter: "drop-shadow(0 0 0px transparent)" },
    whileHover: {
      scale: PRESS_SCALE.hover,
      filter: `drop-shadow(0 0 18px ${accent})`,
    },
    whileTap: { scale: PRESS_SCALE.press },
    transition: SPRINGS.snappy,
  } as const;
}
