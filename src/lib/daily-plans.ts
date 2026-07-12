export type DailyPlan = {
  id: string;
  plan_date: string;
  outcome_1: string | null;
  outcome_2: string | null;
  outcome_3: string | null;
};

/** The plan's outcomes with blanks dropped, in order. */
export function nonEmptyOutcomes(plan: DailyPlan | null): string[] {
  if (!plan) return [];
  return [plan.outcome_1, plan.outcome_2, plan.outcome_3].filter(
    (outcome): outcome is string => !!outcome?.trim(),
  );
}
