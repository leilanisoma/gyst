import { getLocalDayRange, getLocalDayRanges } from "./date-range";
import type { Task } from "./tasks";

export type TodayTasks = {
  overdue: Task[];
  dueToday: Task[];
};

/** Splits open tasks into overdue and due-today, relative to `reference` in `timeZone`. */
export function bucketTodayTasks(
  tasks: Task[],
  reference: Date,
  timeZone: string,
): TodayTasks {
  const { start, end } = getLocalDayRange(reference, timeZone);
  const overdue: Task[] = [];
  const dueToday: Task[] = [];

  for (const task of tasks) {
    if (task.status === "completed" || !task.due_date) continue;
    const dueDate = new Date(task.due_date);
    if (dueDate < start) {
      overdue.push(task);
    } else if (dueDate < end) {
      dueToday.push(task);
    }
  }

  return { overdue, dueToday };
}

export type WeekDay = {
  start: Date;
  end: Date;
  tasks: Task[];
};

/** Groups open, dated tasks into `days` consecutive local days starting with `reference`'s day. */
export function bucketWeekTasks(
  tasks: Task[],
  reference: Date,
  timeZone: string,
  days: number,
): WeekDay[] {
  const ranges = getLocalDayRanges(reference, timeZone, days);
  const openDatedTasks = tasks.filter(
    (task) => task.status !== "completed" && task.due_date,
  );

  return ranges.map(({ start, end }) => ({
    start,
    end,
    tasks: openDatedTasks.filter((task) => {
      const dueDate = new Date(task.due_date!);
      return dueDate >= start && dueDate < end;
    }),
  }));
}
