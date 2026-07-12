import type { SupabaseServiceClient } from "@/lib/supabase/service";
import type { createClient } from "@/lib/supabase/server";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

const DEFAULT_TARGET_GRAD_YEAR = 2027;

/** Shared by the manual capture action and the discovery pipeline so both score against the same eligibility year. */
export async function getTargetGradYear(
  supabase: SupabaseServerClient | SupabaseServiceClient,
  userId: string,
): Promise<number> {
  const { data: preferences } = await supabase
    .from("preferences")
    .select("recruiting_preferences")
    .eq("id", userId)
    .maybeSingle();
  return (
    (preferences?.recruiting_preferences as { target_grad_year?: number } | null)
      ?.target_grad_year ?? DEFAULT_TARGET_GRAD_YEAR
  );
}
