/** 5-stage thresholds (share of school tasks completed) for the study nook's ambient growth plant — same 5-stage scale as the hub's XP visual and Wellness's greenhouse plant, fed by school task completion instead. */
const COMPLETION_GROWTH_THRESHOLDS = [0, 0.25, 0.5, 0.75, 1] as const;

/** Share of school-area tasks currently marked completed, out of all school-area tasks. 0 when there are none yet (nothing to divide by, not "fully grown"). */
export function schoolTaskCompletionRate(tasks: { status: string }[]): number {
  if (tasks.length === 0) return 0;
  const completed = tasks.filter((task) => task.status === "completed").length;
  return completed / tasks.length;
}

/** Growth stage (0..4) for the study nook's ambient plant, from `schoolTaskCompletionRate`. */
export function schoolGrowthStage(completionRate: number): number {
  let stage = 0;
  for (let i = 0; i < COMPLETION_GROWTH_THRESHOLDS.length; i++) {
    if (completionRate >= COMPLETION_GROWTH_THRESHOLDS[i]) stage = i;
  }
  return stage;
}
