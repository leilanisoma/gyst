import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * The "blur block" (Phase 9D, 2026-07-20) — a single frosted-glass panel
 * that holds a room page's entire content, so the illustrated room art
 * stays visible around the edges instead of being covered by stacked
 * dashboard cards. Scrolls internally (`overflow-y-auto`) so the page
 * itself never scrolls — only this panel's contents can, when they're
 * taller than the viewport.
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
        "bg-card/75 ring-foreground/10 shadow-cozy relative z-10 mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 overflow-y-auto rounded-3xl p-6 ring-1 backdrop-blur-xl",
        className,
      )}
    >
      {children}
    </div>
  );
}
