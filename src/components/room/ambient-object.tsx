"use client";

import Link from "next/link";
import { motion, useMotionValue, type PanInfo } from "motion/react";
import { useEffect, useRef, type MouseEvent } from "react";

import { floatingObjectMotionProps } from "@/lib/motion";
import { cn } from "@/lib/utils";

const STORAGE_PREFIX = "gyst:room-object-drag:";

/** Reads a saved drag offset (px, relative to the object's CSS rest position). */
function loadOffset(id: string): { x: number; y: number } {
  if (typeof window === "undefined") return { x: 0, y: 0 };
  try {
    const raw = window.localStorage.getItem(`${STORAGE_PREFIX}${id}`);
    if (!raw) return { x: 0, y: 0 };
    const parsed = JSON.parse(raw) as { x?: number; y?: number };
    return { x: Number(parsed.x) || 0, y: Number(parsed.y) || 0 };
  } catch {
    return { x: 0, y: 0 };
  }
}

function saveOffset(id: string, x: number, y: number) {
  try {
    window.localStorage.setItem(`${STORAGE_PREFIX}${id}`, JSON.stringify({ x, y }));
  } catch {
    // Best-effort — private browsing/quota failures just mean the drag
    // doesn't persist, not worth surfacing to the user.
  }
}

/** How far (px) a drag has to travel before a click on release is suppressed. */
const DRAG_CLICK_THRESHOLD_PX = 4;

/**
 * A big floating "thing in the room" (Phase 9D, 2026-07-20) — the mailbox
 * (Gmail), bedside journal (Inbox), and wall thermostat (Settings). No
 * card/circle chrome, just the object image itself sitting in the scene,
 * alpha-transparent (background-removed 2026-07-20); hovering glows it
 * instead of lifting a box.
 *
 * Draggable (2026-07-20) — `id` is the storage key for the dragged offset,
 * persisted to `localStorage` (a per-device UI preference, not data worth a
 * migration) and restored on mount so a reload keeps it where it was left.
 * The offset is added on top of whatever rest position `className` sets
 * (e.g. `absolute top-[10%] left-[6%]`), not a replacement for it.
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
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const draggedRef = useRef(false);

  useEffect(() => {
    const saved = loadOffset(id);
    x.set(saved.x);
    y.set(saved.y);
    // Only re-sync from storage if the object identity changes — `x`/`y`
    // are stable MotionValue refs, not reactive state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  function handleDrag(_: PointerEvent, info: PanInfo) {
    if (
      Math.abs(info.offset.x) > DRAG_CLICK_THRESHOLD_PX ||
      Math.abs(info.offset.y) > DRAG_CLICK_THRESHOLD_PX
    ) {
      draggedRef.current = true;
    }
  }

  function handleDragEnd() {
    saveOffset(id, x.get(), y.get());
  }

  /** Swallow the click Framer/the browser fires right after a real drag. */
  function guardClick<T>(handler: (event: MouseEvent<T>) => void) {
    return (event: MouseEvent<T>) => {
      if (draggedRef.current) {
        draggedRef.current = false;
        event.preventDefault();
        event.stopPropagation();
        return;
      }
      handler(event);
    };
  }

  const img = (
    <motion.img
      src={image}
      alt=""
      draggable={false}
      drag
      dragMomentum={false}
      style={{ x, y }}
      onDragStart={() => {
        draggedRef.current = false;
      }}
      onDrag={handleDrag}
      onDragEnd={handleDragEnd}
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
