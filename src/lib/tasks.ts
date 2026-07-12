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

export type Task = {
  id: string;
  title: string;
  notes: string | null;
  area: string;
  status: TaskStatus;
  priority: TaskPriority;
  estimated_minutes: number | null;
  due_date: string | null;
};
