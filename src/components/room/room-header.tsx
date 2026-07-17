"use client";

import { motion } from "motion/react";
import type { LucideIcon } from "lucide-react";

/**
 * The landing side of a `RoomDoorway`'s zoom transition (Phase 9D). Same
 * `layoutId` (via `id`) as the doorway that links here — render this in
 * place of a page's plain `<h1>` so navigating from the hub feels like the
 * doorway grew into the page instead of a route swap.
 */
export function RoomHeader({
  id,
  label,
  description,
  icon: Icon,
  accent,
}: {
  id: string;
  label: string;
  description?: string;
  icon: LucideIcon;
  accent: string;
}) {
  return (
    <motion.div
      layoutId={`room-${id}`}
      layout
      className="bg-card ring-foreground/10 shadow-cozy flex items-center gap-4 rounded-2xl p-5 ring-1"
    >
      <div
        className="flex size-12 shrink-0 items-center justify-center rounded-full"
        style={{ backgroundColor: accent }}
      >
        <Icon className="size-6 text-white" aria-hidden="true" />
      </div>
      <div>
        <h1 className="text-lg font-semibold tracking-tight">{label}</h1>
        {description && (
          <p className="text-muted-foreground text-sm">{description}</p>
        )}
      </div>
    </motion.div>
  );
}
