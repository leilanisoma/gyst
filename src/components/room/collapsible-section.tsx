import type { ReactNode } from "react";

/**
 * One collapsed-by-default section in a room's secondary panel — native
 * `<details>`, no new dependency for something this simple. Established as
 * the default room template (Phase 9D-2, Wellness) for keeping a "star"
 * panel uncluttered while secondary content stays reachable; reused as-is
 * for every room since (9D-4 Recruiting) unless a room's content clearly
 * needs something different.
 */
export function CollapsibleSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <details className="group border-border/60 border-b pb-3 last:border-b-0 last:pb-0">
      <summary className="marker:content-none flex cursor-pointer list-none items-center justify-between text-sm font-semibold">
        {title}
        <span className="text-muted-foreground text-xs transition-transform group-open:rotate-180">
          ▾
        </span>
      </summary>
      <div className="mt-3 flex flex-col gap-3">{children}</div>
    </details>
  );
}
