"use client";

import Link from "next/link";
import { motion } from "motion/react";

import { floatingObjectMotionProps } from "@/lib/motion";
import { cn } from "@/lib/utils";

/**
 * A big floating "thing in the room" (Phase 9D, 2026-07-20) — the mailbox
 * (Gmail), bedside journal (Inbox), and wall thermostat (Settings). No
 * card/circle chrome, just the object image itself sitting in the scene,
 * now alpha-transparent (background-removed 2026-07-20 — see
 * `docs/PHASES/phase-9d.md`); hovering glows it instead of lifting a box.
 *
 * Pass `href` to navigate (mailbox/thermostat still route to their own
 * pages) or `onClick` to open an in-scene popup instead (the journal,
 * which now opens `JournalPopup` directly on the hub rather than routing
 * to `/inbox`) — exactly one of the two.
 */
export function AmbientObject({
  href,
  onClick,
  label,
  image,
  accent,
  className,
}: {
  href?: string;
  onClick?: () => void;
  label: string;
  image: string;
  accent: string;
  className?: string;
}) {
  const img = (
    <motion.img
      src={image}
      alt=""
      {...floatingObjectMotionProps(accent)}
      className="size-full object-contain"
    />
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label={label}
        className={cn("block", className)}
      >
        {img}
      </button>
    );
  }

  return (
    <Link href={href!} aria-label={label} className={cn("block", className)}>
      {img}
    </Link>
  );
}
