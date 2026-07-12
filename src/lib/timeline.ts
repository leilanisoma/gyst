import { getLocalTimeUtc } from "./date-range";
import type { RecurringSchedule } from "./recurring-schedules";

export type TimelineEvent = {
  id: string;
  title: string;
  start_at: string;
  end_at: string;
  all_day: boolean;
  location: string | null;
};

export type TimelineItem = {
  key: string;
  title: string;
  start: Date;
  end: Date;
  allDay: boolean;
  location: string | null;
  source: "google" | "recurring";
};

/** Merges synced Google events with manually entered recurring schedules into one sorted timeline for `now`'s local day. */
export function buildDailyTimeline(
  events: TimelineEvent[],
  todaySchedules: Pick<
    RecurringSchedule,
    "id" | "title" | "start_time" | "end_time" | "location"
  >[],
  now: Date,
  timeZone: string,
): TimelineItem[] {
  const items: TimelineItem[] = [
    ...events.map((event) => ({
      key: `google:${event.id}`,
      title: event.title,
      start: new Date(event.start_at),
      end: new Date(event.end_at),
      allDay: event.all_day,
      location: event.location,
      source: "google" as const,
    })),
    ...todaySchedules.map((schedule) => ({
      key: `recurring:${schedule.id}`,
      title: schedule.title,
      start: getLocalTimeUtc(now, timeZone, schedule.start_time),
      end: getLocalTimeUtc(now, timeZone, schedule.end_time),
      allDay: false,
      location: schedule.location,
      source: "recurring" as const,
    })),
  ];

  return items.sort((a, b) => a.start.getTime() - b.start.getTime());
}
