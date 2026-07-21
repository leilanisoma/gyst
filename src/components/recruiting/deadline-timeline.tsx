import Link from "next/link";
import { CalendarClock, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { computeDeadlineTimeline, type TimelineApplication } from "@/lib/recruiting-timeline";

const URGENCY_DOT: Record<string, string> = {
  overdue: "bg-destructive",
  today: "bg-amber-500",
  upcoming: "bg-muted-foreground/40",
};

/**
 * Replaces the old separate ClosingSoon/FollowUpsDue text lists (Phase
 * 9D-4) — one date-sorted timeline for both application deadlines and
 * next-action follow-ups, since both were really the same "what's coming
 * up" question. A vertical rail + marker per entry, not a formal chart
 * (dataviz skill: this is a sorted list, the honest form for a handful of
 * dated items, not a plot).
 */
export function DeadlineTimeline({
  applications,
}: {
  applications: TimelineApplication[];
}) {
  const entries = computeDeadlineTimeline(applications);

  if (entries.length === 0) return null;

  return (
    <div className="flex flex-col gap-3">
      <h2 className="flex items-center gap-2 text-sm font-semibold">
        <CalendarClock className="size-4" />
        Coming up
      </h2>
      <ol className="relative flex flex-col gap-3 border-l border-border pl-4">
        {entries.map((entry, i) => (
          <li key={`${entry.applicationId}-${entry.kind}-${i}`} className="relative">
            <span
              className={`absolute top-1.5 -left-[21px] size-2.5 rounded-full ${URGENCY_DOT[entry.urgency]}`}
              aria-hidden="true"
            />
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm">
                <span className="font-medium">{entry.title}</span>
                {entry.companyName && (
                  <span className="text-muted-foreground"> @ {entry.companyName}</span>
                )}
              </p>
              {entry.url && (
                <Link
                  href={entry.url}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="View posting"
                  className="text-muted-foreground hover:text-foreground"
                >
                  <ExternalLink className="size-3.5" />
                </Link>
              )}
            </div>
            <p className="text-muted-foreground text-xs">
              {entry.kind === "deadline" ? "Deadline" : entry.label}
              {" — "}
              {entry.urgency === "overdue" ? (
                <Badge variant="destructive" className="ml-1">
                  overdue
                </Badge>
              ) : entry.urgency === "today" ? (
                <span className="text-amber-600 dark:text-amber-400">today</span>
              ) : (
                new Date(entry.date).toLocaleDateString()
              )}
            </p>
          </li>
        ))}
      </ol>
    </div>
  );
}
