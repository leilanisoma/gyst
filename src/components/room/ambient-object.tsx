"use client";

import Link from "next/link";
import { motion } from "motion/react";

import { floatingObjectMotionProps } from "@/lib/motion";
import { cn } from "@/lib/utils";

/**
 * A big floating "thing in the room" (Phase 9D, 2026-07-20) — the mailbox
 * (Gmail), bedside journal (Inbox), and wall thermostat (Settings). No
 * card/circle chrome, just the object image itself sitting in the scene;
 * hovering glows it instead of lifting a box. `image` is an isolated object
 * PNG on a plain white background (see `docs/PHASES/phase-9d.md`) — not
 * yet alpha-transparent, so a faint white edge is still visible around each
 * object until a real cutout pass happens.
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
    <Link href={href} aria-label={label} className={cn("block", className)}>
      <motion.img
        src={image}
        alt=""
        {...floatingObjectMotionProps(accent)}
        className="size-full object-contain"
      />
    </Link>
  );
}
