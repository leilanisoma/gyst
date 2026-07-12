import type { createClient } from "@/lib/supabase/server";
import { decryptSecret, encryptSecret } from "@/lib/crypto";
import {
  exchangeCodeForTokens,
  refreshGoogleAccessToken,
  type GoogleTokenResponse,
} from "./oauth";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

const PROVIDER = "google" as const;
/** Refresh proactively this many seconds before actual expiry. */
const EXPIRY_SKEW_SECONDS = 60;

/**
 * Exchanges an OAuth code for tokens and persists them encrypted. Returns
 * the granted scope string (space-delimited) for the caller to record on
 * `integrations`.
 */
export async function connectGoogleTokens(
  supabase: SupabaseServerClient,
  userId: string,
  code: string,
): Promise<{ scope: string; accessToken: string }> {
  const tokens = await exchangeCodeForTokens(code);
  await persistTokens(supabase, userId, tokens);
  return { scope: tokens.scope, accessToken: tokens.access_token };
}

async function persistTokens(
  supabase: SupabaseServerClient,
  userId: string,
  tokens:
    | GoogleTokenResponse
    | (Omit<GoogleTokenResponse, "refresh_token"> & { refresh_token?: string }),
) {
  const expiresAt = new Date(
    Date.now() + tokens.expires_in * 1000,
  ).toISOString();

  const { error } = await supabase.from("oauth_tokens").upsert(
    {
      user_id: userId,
      provider: PROVIDER,
      access_token_encrypted: encryptSecret(tokens.access_token),
      expires_at: expiresAt,
      scope: tokens.scope,
      ...(tokens.refresh_token
        ? { refresh_token_encrypted: encryptSecret(tokens.refresh_token) }
        : {}),
    },
    { onConflict: "user_id,provider" },
  );
  if (error) throw new Error(`Failed to store Google tokens: ${error.message}`);
}

/**
 * Returns a valid (non-expired) access token, refreshing and re-persisting
 * it first if needed. Returns null if there's no connection to refresh.
 */
export async function getValidGoogleAccessToken(
  supabase: SupabaseServerClient,
  userId: string,
): Promise<string | null> {
  const { data: row } = await supabase
    .from("oauth_tokens")
    .select("access_token_encrypted, refresh_token_encrypted, expires_at")
    .eq("user_id", userId)
    .eq("provider", PROVIDER)
    .maybeSingle();

  if (!row) return null;

  const expiresAt = new Date(row.expires_at).getTime();
  const stillValid = expiresAt - EXPIRY_SKEW_SECONDS * 1000 > Date.now();
  if (stillValid) {
    return decryptSecret(row.access_token_encrypted);
  }

  if (!row.refresh_token_encrypted) return null;

  const refreshToken = decryptSecret(row.refresh_token_encrypted);
  const refreshed = await refreshGoogleAccessToken(refreshToken);
  await persistTokens(supabase, userId, {
    ...refreshed,
    refresh_token: refreshToken,
  });
  return refreshed.access_token;
}

export async function disconnectGoogleTokens(
  supabase: SupabaseServerClient,
  userId: string,
) {
  await supabase
    .from("oauth_tokens")
    .delete()
    .eq("user_id", userId)
    .eq("provider", PROVIDER);
}
