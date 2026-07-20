import { useMotionValue, type PanInfo } from "motion/react";
import { useEffect, useRef, type MouseEvent as ReactMouseEvent } from "react";

const STORAGE_PREFIX = "gyst:room-object-drag:";

/** How far (px) a drag has to travel before a click on release is suppressed. */
const DRAG_CLICK_THRESHOLD_PX = 4;

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

/**
 * Shared drag-and-persist behavior for the room's floating objects (Phase
 * 9D, 2026-07-20) — the mailbox/journal/thermostat and the companion blob
 * all use this. Layers a Framer Motion drag offset (`x`/`y`) on top of
 * whatever CSS rest position the caller sets; the offset is saved to
 * `localStorage` under `id` on drop and restored on mount, so a reload
 * keeps each object where it was left. Per-device UI preference, not data
 * worth a migration.
 *
 * Returns `dragProps` to spread onto the draggable `motion.*` element and
 * `guardClick`, which wraps a click handler so the click Framer/the
 * browser fires right after a real drag doesn't also fire the object's
 * normal action (opening a popup, navigating).
 */
export function useDraggablePosition(id: string) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const draggedRef = useRef(false);

  useEffect(() => {
    const saved = loadOffset(id);
    x.set(saved.x);
    y.set(saved.y);
    // `x`/`y` are stable MotionValue refs, not reactive state — only
    // re-sync from storage if the object identity changes.
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

  const dragProps = {
    drag: true as const,
    dragMomentum: false,
    style: { x, y },
    onDragStart: () => {
      draggedRef.current = false;
    },
    onDrag: handleDrag,
    onDragEnd: handleDragEnd,
  };

  function guardClick<T>(handler: (event: ReactMouseEvent<T>) => void) {
    return (event: ReactMouseEvent<T>) => {
      if (draggedRef.current) {
        draggedRef.current = false;
        event.preventDefault();
        event.stopPropagation();
        return;
      }
      handler(event);
    };
  }

  return { dragProps, guardClick };
}
