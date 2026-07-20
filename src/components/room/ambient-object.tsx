"use client";

import Link from "next/link";
import { motion } from "motion/react";

import { floatingObjectMotionProps } from "@/lib/motion";
import { useDraggablePosition } from "@/lib/use-draggable-position";
import { cn } from "@/lib/utils";

/**
 * A big floating "thing in the room" (Phase 9D, 2026-07-20) — the mailbox
 * (Gmail), bedside journal (Inbox), and wall thermostat (Settings). No
 * card/circle chrome, just the object image itself sitting in the scene,
 * alpha-transparent (background-removed 2026-07-20); hovering glows it
 * instead of lifting a box. Draggable and position-persisted per device —
 * see `useDraggablePosition`.
 *
 * Pass `href` to navigate (mailbox/thermostat still route to their own
 * pages) or `onClick` to open an in-scene popup instead (the journal,
 * which now opens `JournalPopup` directly on the hub rather than routing
 * to `/inbox`) — exactly one of the two.
 */
export function AmbientObject({
  id,
  href,
  onClick,
  label,
  image,
  accent,
  className,
}: {
  id: string;
  href?: string;
  onClick?: () => void;
  label: string;
  image: string;
  accent: string;
  className?: string;
}) {
  const { dragProps, guardClick } = useDraggablePosition(id);

  const img = (
    <motion.img
      src={image}
      alt=""
      draggable={false}
      {...dragProps}
      {...floatingObjectMotionProps(accent)}
      className="size-full cursor-grab object-contain active:cursor-grabbing"
    />
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={guardClick(() => onClick())}
        aria-label={label}
        className={cn("block", className)}
      >
        {img}
      </button>
    );
  }

  return (
    <Link
      href={href!}
      aria-label={label}
      onClick={guardClick(() => {})}
      className={cn("block", className)}
    >
      {img}
    </Link>
  );
}
