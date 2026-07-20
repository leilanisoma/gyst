import type { ReactNode } from "react";

/**
 * A room destination page's header (Phase 9D) — render this in place of a
 * plain `<h1>` for the same illustrated-icon treatment as `RoomDoorway`.
 * Previously shared a `layoutId` with the doorway for a shared-element
 * zoom transition; that mechanic was removed 2026-07-20 in favor of the
 * filmstrip slide (`RouteTransition`/`RoomSlideArrows`) for rooms in
 * `ROOM_SEQUENCE`, and a plain route swap otherwise.
 *
 * `icon` takes an already-rendered element, not a component reference —
 * see `RoomDoorway` for why (Server->Client Component prop serialization).
 */
export function RoomHeader({
  label,
  description,
  icon,
  accent,
}: {
  label: string;
  description?: string;
  icon: ReactNode;
  accent: string;
}) {
  return (
    <div className="bg-card ring-foreground/10 shadow-cozy flex items-center gap-4 rounded-2xl p-5 ring-1">
      <div
        className="flex size-12 shrink-0 items-center justify-center rounded-full"
        style={{ backgroundColor: accent }}
      >
        {icon}
      </div>
      <div>
        <h1 className="text-lg font-semibold tracking-tight">{label}</h1>
        {description && (
          <p className="text-muted-foreground text-sm">{description}</p>
        )}
      </div>
    </div>
  );
}
