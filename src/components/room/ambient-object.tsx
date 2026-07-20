"use client";

import Link from "next/link";
import { motion } from "motion/react";

import { roomObjectMotionProps } from "@/lib/motion";
import { cn } from "@/lib/utils";

/**
 * A small clickable "thing in the room" (Phase 9D) — the mailbox (Gmail),
 * bedside journal (Inbox), and wall thermostat (Settings), as opposed to a
 * full room. `image` is an isolated object PNG generated on a plain white
 * background (see `docs/PHASES/phase-9d.md`) and cropped into the circle —
 * not yet alpha-transparent, so the circle crop is what hides the white
 * background edge until a real cutout pass happens.
 */
export function AmbientObject({
  href,
  label,
  image,
  accent,
  className,
}: {
  href: string;
  label: string;
  image: string;
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
        <div className="size-8 shrink-0 overflow-hidden rounded-full">
          {/* eslint-disable-next-line @next/next/no-img-element -- static public/ asset, no next/image usage elsewhere in this codebase */}
          <img src={image} alt="" className="size-full object-cover" />
        </div>
        <span className="text-xs font-medium">{label}</span>
      </motion.div>
    </Link>
  );
}
