import type { createClient } from "@/lib/supabase/server";
import { createNotification } from "@/lib/notifications";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

const PROVIDER = "canvas" as const;

export type CanvasIntegration = {
  id: string;
  status: "not_connected" | "connected" | "error";
  last_synced_at: string | null;
  error: string | null;
};

export async function getCanvasIntegration(
  supabase: SupabaseServerClient,
  userId: string,
): Promise<CanvasIntegration | null> {
  const { data } = await supabase
    .from("integrations")
    .select("id, status, last_synced_at, error")
    .eq("user_id", userId)
    .eq("provider", PROVIDER)
    .maybeSingle();
  if (!data) return null;
  return { ...data, status: data.status as CanvasIntegration["status"] };
}

export async function markCanvasSynced(
  supabase: SupabaseServerClient,
  userId: string,
) {
  const { error } = await supabase.from("integrations").upsert(
    {
      user_id: userId,
      provider: PROVIDER,
      status: "connected",
      last_synced_at: new Date().toISOString(),
      error: null,
    },
    { onConflict: "user_id,provider" },
  );
  if (error) throw new Error(`Failed to record Canvas sync: ${error.message}`);
}

export async function markCanvasError(
  supabase: SupabaseServerClient,
  userId: string,
  errorMessage: string,
) {
  await supabase.from("integrations").upsert(
    { user_id: userId, provider: PROVIDER, status: "error", error: errorMessage },
    { onConflict: "user_id,provider" },
  );

  // Connector failures should be visible within one sync cycle (PLAN.md §20),
  // matching the Google integration's same-pattern notification.
  await createNotification(supabase, userId, {
    kind: "sync_error",
    title: "Canvas sync ran into a problem",
    body: errorMessage,
    link: "/school",
  });
}
