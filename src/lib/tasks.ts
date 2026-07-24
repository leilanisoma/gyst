export type TaskStatus = "not_started" | "in_progress" | "completed";
export type TaskPriority = "low" | "medium" | "high";

export const TASK_STATUSES: TaskStatus[] = [
  "not_started",
  "in_progress",
  "completed",
];

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  not_started: "Not Started",
  in_progress: "In Progress",
  completed: "Completed",
};

export const TASK_PRIORITIES: TaskPriority[] = ["low", "medium", "high"];

export const TASK_AREAS = [
  "general",
  "recruiting",
  "school",
  "wellness",
] as const;

export type TaskArea = (typeof TASK_AREAS)[number];

export type Task = {
  id: string;
  title: string;
  notes: string | null;
  area: string;
  status: TaskStatus;
  priority: TaskPriority;
  estimated_minutes: number | null;
  due_date: string | null;
  rollover_count: number;
  /** Optional — only present on queries that select/join it (currently just School's task list). */
  course_id?: string | null;
  course_title?: string | null;
  /** From a joined `work_estimates` row — only Canvas-sourced tasks have one. `actual_minutes == null` with `predicted_minutes` set means this task still needs its actual time logged once completed. */
  predicted_minutes?: number | null;
  actual_minutes?: number | null;
};
