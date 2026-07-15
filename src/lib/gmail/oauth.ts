import { getGmailEnv } from "@/lib/env";

const AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_URL = "https://oauth2.googleapis.com/token";

/** Narrowest scopes for each Phase 7 capability (PLAN.md §8, §15 tasks 7.2/7.7). */
export const GMAIL_SCOPES: {
  readonly: string;
  compose: string;
} = {
  readonly: "https://www.googleapis.com/auth/gmail.readonly",
  // Create/update drafts. Google's own scope also technically permits
  // sending — this app's own code never calls a send endpoint, so
  // "draft-only" (task 7.7) is enforced at the call-site level, the same way
  // Calendar's write-back (Phase 3) narrows via scope while relying on this
  // app's code to never touch anything outside the dedicated calendar.
  compose: "https://www.googleapis.com/auth/gmail.compose",
};

export type GmailTokenResponse = {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  scope: string;
  token_type: string;
};

/**
 * Gmail uses its own registered OAuth client (separate GMAIL_CLIENT_ID/
 * SECRET/REDIRECT_URI from Calendar's GOOGLE_*), not a shared one — so this
 * module is self-contained rather than reusing `google/oauth.ts`, even
 * though the two are calling the same Google OAuth2 endpoints.
 */
export function buildGmailAuthUrl(options: {
  scopes: string[];
  state: string;
}): string {
  const env = getGmailEnv();
  const url = new URL(AUTH_URL);
  url.searchParams.set("client_id", env.GMAIL_CLIENT_ID);
  url.searchParams.set("redirect_uri", env.GMAIL_REDIRECT_URI);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("access_type", "offline");
  url.searchParams.set("prompt", "consent");
  url.searchParams.set("include_granted_scopes", "true");
  url.searchParams.set("scope", options.scopes.join(" "));
  url.searchParams.set("state", options.state);
  return url.toString();
}

export async function exchangeGmailCodeForTokens(
  code: string,
): Promise<GmailTokenResponse> {
  const env = getGmailEnv();
  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: env.GMAIL_CLIENT_ID,
      client_secret: env.GMAIL_CLIENT_SECRET,
      redirect_uri: env.GMAIL_REDIRECT_URI,
      grant_type: "authorization_code",
    }),
  });
  if (!response.ok) {
    throw new Error(`Gmail token exchange failed: ${await response.text()}`);
  }
  return response.json();
}

export async function refreshGmailAccessToken(
  refreshToken: string,
): Promise<Omit<GmailTokenResponse, "refresh_token">> {
  const env = getGmailEnv();
  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: env.GMAIL_CLIENT_ID,
      client_secret: env.GMAIL_CLIENT_SECRET,
      grant_type: "refresh_token",
    }),
  });
  if (!response.ok) {
    throw new Error(`Gmail token refresh failed: ${await response.text()}`);
  }
  return response.json();
}
