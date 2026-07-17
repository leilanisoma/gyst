"use client";

import { AnimatePresence, motion, type PanInfo } from "motion/react";
import { usePathname, useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";

import { DURATIONS, EASINGS } from "@/lib/motion";
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
    <AnimatePresence mode="wait" initial={false} custom={direction}>
      {isSlidable ? (
        <motion.div
          key={pathname}
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
        <motion.div
          key={pathname}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: DURATIONS.base, ease: EASINGS.out }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
