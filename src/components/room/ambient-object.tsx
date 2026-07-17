"use client";

import Link from "next/link";
import { motion } from "motion/react";
import type { ReactNode } from "react";

import { roomObjectMotionProps } from "@/lib/motion";
import { cn } from "@/lib/utils";

/**
 * A small clickable "thing in the room" (Phase 9D) — the bedside journal
 * (Inbox) and wall thermostat (Settings), as opposed to a full `RoomDoorway`.
 * Shares the same lift+glow hover mechanic but skips the `layoutId` zoom:
 * these route to plain utility pages with no matching `RoomHeader` to grow
 * into, so there's nothing for a shared-element transition to land on.
 */
export function AmbientObject({
  href,
  label,
  icon,
  accent,
  className,
}: {
  href: string;
  label: string;
  icon: ReactNode;
  accent: string;
  className?: string;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      className={cn("block rounded-xl", className)}
    >
      <motion.div
        {...roomObjectMotionProps(accent)}
        className="bg-card ring-foreground/10 shadow-cozy flex items-center gap-2 rounded-xl px-3 py-2 ring-1"
      >
        <div
          className="flex size-8 shrink-0 items-center justify-center rounded-full"
          style={{ backgroundColor: accent }}
        >
          {icon}
        </div>
        <span className="text-xs font-medium">{label}</span>
      </motion.div>
    </Link>
  );
}
