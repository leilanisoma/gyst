import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import type { ChatUsage } from "@/ai/types";

const DEFAULT_DAILY_CHAT_TOKEN_LIMIT = 200_000;

/**
 * Per-feature daily token cap (PLAN.md §4 "per-feature daily token and
 * dollar limits"). Generous default for a single-user app; override via
 * env if needed — not a required var, so it's not in env.ts's Zod schemas.
 */
export function getDailyChatTokenLimit(): number {
  const raw = process.env.AI_CHAT_DAILY_TOKEN_LIMIT;
  const parsed = raw ? Number(raw) : NaN;
  return Number.isFinite(parsed) && parsed > 0
    ? parsed
    : DEFAULT_DAILY_CHAT_TOKEN_LIMIT;
}

function startOfTodayIso(): string {
  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);
  return start.toISOString();
}

export async function getTodayFeatureTokenUsage(
  supabase: SupabaseClient<Database>,
  userId: string,
  feature: string,
): Promise<number> {
  const { data, error } = await supabase
    .from("ai_usage_events")
    .select("input_tokens, output_tokens")
    .eq("user_id", userId)
    .eq("feature", feature)
    .gte("created_at", startOfTodayIso());
  if (error) throw new Error(error.message);
  return (data ?? []).reduce(
    (sum, row) => sum + row.input_tokens + row.output_tokens,
    0,
  );
}

export async function recordUsage(
  supabase: SupabaseClient<Database>,
  userId: string,
  feature: string,
  provider: string,
  usage: ChatUsage,
): Promise<void> {
  const { error } = await supabase.from("ai_usage_events").insert({
    user_id: userId,
    feature,
    provider,
    input_tokens: usage.inputTokens,
    output_tokens: usage.outputTokens,
  });
  if (error) throw new Error(error.message);
}
