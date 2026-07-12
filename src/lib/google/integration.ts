import type { createClient } from "@/lib/supabase/server";
import { createNotification } from "@/lib/notifications";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

const PROVIDER = "google" as const;

export type GoogleIntegrationSettings = {
  /** Google calendar IDs whose events feed the scheduler as fixed commitments. */
  fixed_calendar_ids?: string[];
  /** ID of the dedicated calendar this app created for writing approved blocks. */
  gyst_calendar_id?: string;
  /** Per-calendar incremental sync cursor (Google issues one syncToken per calendar, not per account). */
  sync_tokens?: Record<string, string>;
};

export type GoogleIntegration = {
  id: string;
  status: "not_connected" | "connected" | "error";
  granted_scopes: string[];
  account_email: string | null;
  settings: GoogleIntegrationSettings;
  last_synced_at: string | null;
  error: string | null;
};

export async function getGoogleIntegration(
  supabase: SupabaseServerClient,
  userId: string,
): Promise<GoogleIntegration | null> {
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
    status: data.status as GoogleIntegration["status"],
    settings: (data.settings ?? {}) as GoogleIntegrationSettings,
  };
}

export async function markGoogleConnected(
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
    throw new Error(`Failed to record Google integration: ${error.message}`);
}

export async function markGoogleError(
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

  // Connector failures should be visible within one sync cycle (PLAN.md §20),
  // not just buried in a settings-page badge nobody's looking at.
  await createNotification(supabase, userId, {
    kind: "sync_error",
    title: "Google Calendar sync ran into a problem",
    body: errorMessage,
    link: "/settings",
  });
}

export async function markGoogleSynced(
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

export async function updateGoogleSettings(
  supabase: SupabaseServerClient,
  userId: string,
  patch: GoogleIntegrationSettings,
) {
  const existing = await getGoogleIntegration(supabase, userId);
  const { error } = await supabase
    .from("integrations")
    .update({ settings: { ...existing?.settings, ...patch } })
    .eq("user_id", userId)
    .eq("provider", PROVIDER);
  if (error)
    throw new Error(`Failed to update Google settings: ${error.message}`);
}

export async function disconnectGoogleIntegration(
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
    throw new Error(
      `Failed to disconnect Google integration: ${error.message}`,
    );
}
