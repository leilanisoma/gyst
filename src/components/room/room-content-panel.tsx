import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * The "blur block" (Phase 9D, 2026-07-20) — a single glass panel that
 * holds a room page's entire content, so the illustrated room art stays
 * visible around the edges instead of being covered by stacked dashboard
 * cards. Scrolls internally (`overflow-y-auto`) so the page itself never
 * scrolls — only this panel's contents can, when they're taller than the
 * viewport. `.room-glass` (2026-07-20, `globals.css`) is the Apple-style
 * shiny/translucent "liquid glass" material — sheen, layered inset/outer
 * shadows, saturated blur — replacing a flatter `bg-card/75 backdrop-blur`.
 */
export function RoomContentPanel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "room-glass relative z-10 mx-auto flex max-h-[85vh] w-full max-w-3xl flex-col gap-6 overflow-y-auto rounded-3xl p-6",
        className,
      )}
    >
      {children}
    </div>
  );
}
