import type { SupabaseServiceClient } from "@/lib/supabase/service";
import type { createClient } from "@/lib/supabase/server";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;
type AnySupabaseClient = SupabaseServerClient | SupabaseServiceClient;

const DEFAULT_TARGET_GRAD_YEAR = 2028;
const DEFAULT_WEEKLY_APPLICATION_GOAL = 5;

type RecruitingPreferences = {
  target_grad_year?: number;
  weekly_application_goal?: number;
};

/** Shared by the manual capture action and the discovery pipeline so both score against the same eligibility year. */
export async function getTargetGradYear(
  supabase: AnySupabaseClient,
  userId: string,
): Promise<number> {
  const { data: preferences } = await supabase
    .from("preferences")
    .select("recruiting_preferences")
    .eq("id", userId)
    .maybeSingle();
  return (
    (preferences?.recruiting_preferences as RecruitingPreferences | null)
      ?.target_grad_year ?? DEFAULT_TARGET_GRAD_YEAR
  );
}

/** Weekly applications-submitted target for the dashboard's goal-vs-actual meter. Same jsonb column as target_grad_year, new key — no migration needed. */
export async function getWeeklyApplicationGoal(
  supabase: AnySupabaseClient,
  userId: string,
): Promise<number> {
  const { data: preferences } = await supabase
    .from("preferences")
    .select("recruiting_preferences")
    .eq("id", userId)
    .maybeSingle();
  return (
    (preferences?.recruiting_preferences as RecruitingPreferences | null)
      ?.weekly_application_goal ?? DEFAULT_WEEKLY_APPLICATION_GOAL
  );
}

export async function setWeeklyApplicationGoal(
  supabase: AnySupabaseClient,
  userId: string,
  goal: number,
): Promise<void> {
  const { data: preferences } = await supabase
    .from("preferences")
    .select("recruiting_preferences")
    .eq("id", userId)
    .maybeSingle();
  const current = (preferences?.recruiting_preferences as RecruitingPreferences | null) ?? {};
  await supabase
    .from("preferences")
    .update({ recruiting_preferences: { ...current, weekly_application_goal: goal } })
    .eq("id", userId);
}
