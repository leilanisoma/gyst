"use client";

import Link from "next/link";
import { motion } from "motion/react";
import type { ReactNode } from "react";

import { roomObjectMotionProps } from "@/lib/motion";
import { cn } from "@/lib/utils";

/**
 * A clickable "room" on the Living Room hub (Phase 9D). Navigation to the
 * destination page is a plain route swap (or a filmstrip slide for the
 * rooms in `ROOM_SEQUENCE`) — no shared-element zoom into a `RoomHeader`
 * on the far end; that mechanic was removed 2026-07-20.
 *
 * `icon` takes an already-rendered element (`<HeartPulse />`), not a
 * component reference — a Lucide component itself isn't a plain
 * serializable value, so it can't cross the Server->Client Component
 * boundary when a server-rendered page passes room data down as props.
 */
export function RoomDoorway({
  href,
  label,
  description,
  icon,
  accent,
  className,
}: {
  href: string;
  label: string;
  description?: string;
  icon: ReactNode;
  accent: string;
  className?: string;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      className={cn("block rounded-2xl", className)}
    >
      <motion.div
        {...roomObjectMotionProps(accent)}
        className="bg-card ring-foreground/10 shadow-cozy flex flex-col items-center gap-2 rounded-2xl p-5 ring-1"
      >
        <div
          className="flex size-12 items-center justify-center rounded-full"
          style={{ backgroundColor: accent }}
        >
          {icon}
        </div>
        <span className="text-sm font-semibold">{label}</span>
        {description && (
          <span className="text-muted-foreground text-center text-xs">
            {description}
          </span>
        )}
      </motion.div>
    </Link>
  );
}
