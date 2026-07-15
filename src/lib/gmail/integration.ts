import type { createClient } from "@/lib/supabase/server";
import { createNotification } from "@/lib/notifications";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

const PROVIDER = "gmail" as const;

/** Default when a user hasn't set one (task 7.8) — narrow, per DATA_CLASSIFICATION.md's "Highly sensitive" tier for Gmail content. */
export const DEFAULT_GMAIL_RETENTION_DAYS = 30;

export type GmailIntegrationSettings = {
  /** Gmail search query (e.g. `label:job-search`) scoping sync — required before any sync runs (task 7.3, never scan the whole inbox). */
  search_query?: string;
  /** How long an extracted item's excerpt is kept before the purge cron deletes it (task 7.8). */
  retention_days?: number;
};

export type GmailIntegration = {
  id: string;
  status: "not_connected" | "connected" | "error";
  granted_scopes: string[];
  account_email: string | null;
  settings: GmailIntegrationSettings;
  last_synced_at: string | null;
  error: string | null;
};

export async function getGmailIntegration(
  supabase: SupabaseServerClient,
  userId: string,
): Promise<GmailIntegration | null> {
  const { data } = await supabase
    .from("integrations")
    .select(
      "id, status, granted_scopes, account_email, settings, last_synced_at, error",
    )
    .eq("user_id", userId)
    .eq("provider", PROVIDER)
    .maybeSingle();
  if (!data) return null;
  return {
    ...data,
    status: data.status as GmailIntegration["status"],
    settings: (data.settings ?? {}) as GmailIntegrationSettings,
  };
}

export async function markGmailConnected(
  supabase: SupabaseServerClient,
  userId: string,
  input: { scope: string; accountEmail: string },
) {
  const grantedScopes = input.scope.split(" ").filter(Boolean);
  const { error } = await supabase.from("integrations").upsert(
    {
      user_id: userId,
      provider: PROVIDER,
      status: "connected",
      granted_scopes: grantedScopes,
      account_email: input.accountEmail,
      error: null,
    },
    { onConflict: "user_id,provider" },
  );
  if (error)
    throw new Error(`Failed to record Gmail integration: ${error.message}`);
}

export async function markGmailError(
  supabase: SupabaseServerClient,
  userId: string,
  errorMessage: string,
) {
  await supabase.from("integrations").upsert(
    {
      user_id: userId,
      provider: PROVIDER,
      status: "error",
      error: errorMessage,
    },
    { onConflict: "user_id,provider" },
  );

  await createNotification(supabase, userId, {
    kind: "sync_error",
    title: "Gmail sync ran into a problem",
    body: errorMessage,
    link: "/settings",
  });
}

export async function markGmailSynced(
  supabase: SupabaseServerClient,
  userId: string,
) {
  await supabase
    .from("integrations")
    .update({
      last_synced_at: new Date().toISOString(),
      status: "connected",
      error: null,
    })
    .eq("user_id", userId)
    .eq("provider", PROVIDER);
}

export async function updateGmailSettings(
  supabase: SupabaseServerClient,
  userId: string,
  patch: GmailIntegrationSettings,
) {
  const existing = await getGmailIntegration(supabase, userId);
  const { error } = await supabase
    .from("integrations")
    .update({ settings: { ...existing?.settings, ...patch } })
    .eq("user_id", userId)
    .eq("provider", PROVIDER);
  if (error)
    throw new Error(`Failed to update Gmail settings: ${error.message}`);
}

export async function disconnectGmailIntegration(
  supabase: SupabaseServerClient,
  userId: string,
) {
  const { error } = await supabase
    .from("integrations")
    .update({
      status: "not_connected",
      granted_scopes: [],
      settings: {},
      error: null,
    })
    .eq("user_id", userId)
    .eq("provider", PROVIDER);
  if (error)
    throw new Error(`Failed to disconnect Gmail integration: ${error.message}`);
}
