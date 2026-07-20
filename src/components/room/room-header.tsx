import type { ReactNode } from "react";

/**
 * A room destination page's header (Phase 9D) — an icon-in-circle plus
 * title/description, used by Wellness/School/Recruiting (the three rooms
 * in `ROOM_SEQUENCE`, reached by sliding via `RouteTransition`/
 * `RoomSlideArrows`, not a click-to-zoom doorway — that mechanic existed
 * briefly in 9D-1 and was removed 2026-07-20).
 *
 * `icon` takes an already-rendered element (`<HeartPulse />`), not a
 * component reference — a Lucide component itself isn't a plain
 * serializable value, so it can't cross the Server->Client Component
 * boundary when a server-rendered page passes room data down as props.
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
