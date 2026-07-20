"use client";

import { AnimatePresence, motion, type PanInfo } from "motion/react";
import { usePathname, useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";

import { DURATIONS, EASINGS, SPRINGS } from "@/lib/motion";
import { adjacentRoomHrefs, roomSequenceIndex, slideDirection } from "@/lib/room-sequence";

/** How far (px) a drag has to travel before it counts as a swipe-to-navigate. */
const SWIPE_THRESHOLD_PX = 80;

/** Dynamic variants keyed by slide direction (via the `custom` prop) — motion/react only types `initial`/`exit` functions through `variants`, not inline. */
const slideVariants = {
  initial: (dir: number) => ({
    x: dir === 0 ? 0 : dir > 0 ? "100%" : "-100%",
    opacity: dir === 0 ? 0 : 1,
  }),
  animate: { x: 0, opacity: 1 },
  exit: (dir: number) => ({
    x: dir > 0 ? "-100%" : dir < 0 ? "100%" : 0,
    opacity: dir === 0 ? 0 : 1,
  }),
};

/**
 * Fades/lifts route content in on navigation instead of an abrupt swap
 * (Phase 9C) — except between the four rooms in the horizontal filmstrip
 * (Garden/Living Room/Nook/Study Desk, 2026-07-17 direction), which slide
 * past each other instead, direction computed from the previous pathname,
 * and can also be dragged/swiped directly instead of only using
 * `RoomSlideArrows`.
 */
export function RouteTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  // "Storing information from previous renders" (React's own pattern for
  // this, since a ref read/write during render is flagged by
  // react-hooks/refs as unsafe under concurrent rendering): recompute
  // `direction` and snapshot `pathname` in the same render pass whenever
  // the pathname actually changes.
  const [prevPathname, setPrevPathname] = useState(pathname);
  const [direction, setDirection] = useState(0);
  if (pathname !== prevPathname) {
    setDirection(slideDirection(prevPathname, pathname));
    setPrevPathname(pathname);
  }

  const isSlidable = roomSequenceIndex(pathname) !== -1;
  const { prev, next } = adjacentRoomHrefs(pathname);

  function handleDragEnd(_: PointerEvent, info: PanInfo) {
    if (info.offset.x <= -SWIPE_THRESHOLD_PX && next) router.push(next);
    else if (info.offset.x >= SWIPE_THRESHOLD_PX && prev) router.push(prev);
  }

  return (
    // No `mode="wait"` — that mode fully unmounts the exiting page before
    // mounting the next one, which for a *slide* defeats the point (the
    // two can't actually pass each other) and, worse, left a gap with
    // nothing rendered at all between exit finishing and enter starting —
    // long enough to show the bare page background through (the "yellow
    // screen" flash, 2026-07-20). Default (sync) mode overlaps exit/enter,
    // so both stacked `absolute` layers below are always covering the
    // screen — never nothing. `h-screen` here is load-bearing, not
    // decorative: once both layers are `position: absolute`, this wrapper
    // has no intrinsic height on its own, and the parent's
    // `overflow-x-hidden` (in `AppShell`) then computes its *other* axis
    // (`overflow-y`) to `auto` per the CSS overflow spec — against a
    // collapsed 0px-tall box, that clips/scrolls away everything, which is
    // exactly what "no background or anything" was (2026-07-20 follow-up).
    <div className="relative h-screen">
      <AnimatePresence initial={false} custom={direction}>
        {isSlidable ? (
          <motion.div
            key={pathname}
            className="absolute top-0 left-0 w-full"
            custom={direction}
            variants={slideVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.4}
            onDragEnd={handleDragEnd}
            transition={{ duration: DURATIONS.slow, ease: EASINGS.standard }}
          >
            {children}
          </motion.div>
        ) : (
          // "Pop" transition (2026-07-17/2026-07-20): a little zoom-in
          // bounce instead of a flat fade, so landing on Gmail/Inbox/
          // Settings from one of their ambient objects feels like
          // something opened rather than a plain page swap.
          <motion.div
            key={pathname}
            className="absolute top-0 left-0 w-full"
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={SPRINGS.snappy}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
