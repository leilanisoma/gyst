import { scoreTask, type EnergyLevel, type ScorableTask } from "./scheduling";
import type { Task } from "./tasks";

export type OverwhelmPlan = {
  urgent: Task | null;
  lifeMaintenance: Task | null;
  selfCare: Task | null;
  reviewQueue: Task[];
  starterStep: string | null;
};

function toScorable(task: Task): ScorableTask {
  return {
    due_date: task.due_date,
    priority: task.priority,
    goal_id: null,
    estimated_minutes: task.estimated_minutes,
    energy: null,
    rollover_count: task.rollover_count,
  };
}

const SHORT_TASK_MINUTES = 20;

/**
 * The smallest day that still counts (PLAN.md §5 Overwhelm mode): one urgent
 * task, one small life-maintenance task, one self-care action, everything
 * else visibly set aside rather than silently rescheduled. Advisory only —
 * nothing here is written back to a task.
 */
export function buildOverwhelmPlan(
  tasks: Task[],
  now: Date,
  userEnergy: EnergyLevel,
): OverwhelmPlan {
  const open = tasks.filter((task) => task.status !== "completed");
  const scored = open
    .map((task) => ({
      task,
      score: scoreTask(toScorable(task), { now, userEnergy }),
    }))
    .sort((a, b) => b.score - a.score);

  const wellness = scored.filter((s) => s.task.area === "wellness");
  const other = scored.filter((s) => s.task.area !== "wellness");

  const urgent = other[0]?.task ?? null;

  const lifeMaintenance =
    other.find(
      (s) =>
        s.task.id !== urgent?.id &&
        (s.task.estimated_minutes == null ||
          s.task.estimated_minutes <= SHORT_TASK_MINUTES),
    )?.task ??
    other.find((s) => s.task.id !== urgent?.id)?.task ??
    null;

  const selfCare = wellness[0]?.task ?? null;

  const chosenIds = new Set(
    [urgent, lifeMaintenance, selfCare]
      .filter((task): task is Task => task != null)
      .map((task) => task.id),
  );
  const reviewQueue = open.filter((task) => !chosenIds.has(task.id));

  const starterStep = urgent
    ? `Start with just 10 minutes on: ${urgent.title}`
    : null;

  return { urgent, lifeMaintenance, selfCare, reviewQueue, starterStep };
}
