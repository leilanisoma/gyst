/**
 * A room destination page's header (Phase 9D) — just title/description,
 * used by Wellness/School/Recruiting (the three rooms in `ROOM_SEQUENCE`,
 * reached by sliding via `RouteTransition`/`RoomSlideArrows`). Previously
 * an icon-in-colored-circle badge; dropped 2026-07-20 once pages moved
 * inside `RoomContentPanel` over the illustrated room art — a flat accent
 * circle read as the same dashboard "artifact" the room art replaced.
 */
export function RoomHeader({
  label,
  description,
}: {
  label: string;
  description?: string;
}) {
  return (
    <div>
      <h1 className="text-lg font-semibold tracking-tight">{label}</h1>
      {description && (
        <p className="text-muted-foreground text-sm">{description}</p>
      )}
    </div>
  );
}
