export type ScheduleCategory = "class" | "fencing" | "other";

export const SCHEDULE_CATEGORIES: ScheduleCategory[] = [
  "class",
  "fencing",
  "other",
];

export const SCHEDULE_CATEGORY_LABELS: Record<ScheduleCategory, string> = {
  class: "Class",
  fencing: "Fencing",
  other: "Other",
};

export const DAY_LABELS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export type RecurringSchedule = {
  id: string;
  title: string;
  category: ScheduleCategory;
  day_of_week: number;
  start_time: string;
  end_time: string;
  location: string | null;
  active: boolean;
};

export function sortSchedules(
  schedules: RecurringSchedule[],
): RecurringSchedule[] {
  return [...schedules].sort(
    (a, b) =>
      a.day_of_week - b.day_of_week || a.start_time.localeCompare(b.start_time),
  );
}

export type ScheduleDay = {
  day: number;
  label: string;
  schedules: RecurringSchedule[];
};

/** Groups schedules into all 7 days (Sunday-first), including empty days. */
export function groupSchedulesByDay(
  schedules: RecurringSchedule[],
): ScheduleDay[] {
  const sorted = sortSchedules(schedules);
  return DAY_LABELS.map((label, day) => ({
    day,
    label,
    schedules: sorted.filter((schedule) => schedule.day_of_week === day),
  }));
}
