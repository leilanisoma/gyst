const DAY_PERIODS = ["dawn", "day", "dusk", "night"] as const;

/**
 * Full-bleed illustrated room art (Phase 9D) behind a room page's content —
 * one stacked `<img>` per day period; `globals.css`'s `[data-room-bg-period]`
 * rules show only the one matching `DayPeriodProvider`'s `data-day-period`
 * on `<html>`, the same attribute-matching approach already used for the
 * color tokens. Render inside a `relative isolate` ancestor. `room` is the
 * folder name under `public/rooms/` (e.g. `"garden"`, `"living-room"`).
 */
export function RoomBackground({ room }: { room: string }) {
  return (
    <div className="absolute inset-0 -z-10 overflow-hidden" aria-hidden="true">
      {DAY_PERIODS.map((period) => (
        // eslint-disable-next-line @next/next/no-img-element -- static public/ asset, no next/image usage elsewhere in this codebase
        <img
          key={period}
          src={`/rooms/${room}/${period}.png`}
          alt=""
          data-room-bg-period={period}
          className="absolute inset-0 size-full object-cover"
        />
      ))}
    </div>
  );
}
