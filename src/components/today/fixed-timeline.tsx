import type { TimelineItem } from "@/lib/timeline";

export function FixedTimeline({
  items,
  timeZone,
}: {
  items: TimelineItem[];
  timeZone: string;
}) {
  if (items.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        Nothing fixed today — connect Google Calendar in Settings to see
        classes, fencing, and other commitments here.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-1.5">
      {items.map((item) => (
        <li
          key={item.key}
          className="border-border bg-card flex items-center justify-between gap-2 rounded-lg border p-2.5 text-sm"
        >
          <span className="min-w-0 truncate font-medium">{item.title}</span>
          <span className="text-muted-foreground shrink-0 text-xs">
            {item.allDay
              ? "All day"
              : `${item.start.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit", timeZone })} – ${item.end.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit", timeZone })}`}
          </span>
        </li>
      ))}
    </ul>
  );
}
