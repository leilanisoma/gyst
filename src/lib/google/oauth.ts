import { getGoogleEnv } from "@/lib/env";

const AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_URL = "https://oauth2.googleapis.com/token";

/** Narrowest scopes for each phase-3 capability (PLAN.md §8, §14). */
export const GOOGLE_SCOPES: {
  calendarReadonly: string;
  calendarAppCreated: string;
} = {
  calendarReadonly: "https://www.googleapis.com/auth/calendar.readonly",
  // Only grants access to calendars/events this app itself created — the
  // API-level guarantee behind "write only to a dedicated GYST calendar."
  calendarAppCreated: "https://www.googleapis.com/auth/calendar.app.created",
};

export type GoogleTokenResponse = {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  scope: string;
  token_type: string;
};

export function buildGoogleAuthUrl(options: {
  scopes: string[];
  state: string;
  /** Overrides GOOGLE_REDIRECT_URI — Gmail (Phase 7) uses its own callback route/redirect URI. */
  redirectUri?: string;
}): string {
  const env = getGoogleEnv();
  const url = new URL(AUTH_URL);
  url.searchParams.set("client_id", env.GOOGLE_CLIENT_ID);
  url.searchParams.set("redirect_uri", options.redirectUri ?? env.GOOGLE_REDIRECT_URI);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("access_type", "offline");
  // Force the consent screen so a refresh_token is issued every time,
  // including incremental-scope upgrades (Phase 3's write-scope request).
  url.searchParams.set("prompt", "consent");
  url.searchParams.set("include_granted_scopes", "true");
  url.searchParams.set("scope", options.scopes.join(" "));
  url.searchParams.set("state", options.state);
  return url.toString();
}

export async function exchangeCodeForTokens(
  code: string,
  /** Overrides GOOGLE_REDIRECT_URI — must match whatever redirect_uri was used to obtain `code`. */
  redirectUri?: string,
): Promise<GoogleTokenResponse> {
  const env = getGoogleEnv();
  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
      redirect_uri: redirectUri ?? env.GOOGLE_REDIRECT_URI,
      grant_type: "authorization_code",
    }),
  });
  if (!response.ok) {
    throw new Error(`Google token exchange failed: ${await response.text()}`);
  }
  return response.json();
}

export async function refreshGoogleAccessToken(
  refreshToken: string,
): Promise<Omit<GoogleTokenResponse, "refresh_token">> {
  const env = getGoogleEnv();
  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
      grant_type: "refresh_token",
    }),
  });
  if (!response.ok) {
    throw new Error(`Google token refresh failed: ${await response.text()}`);
  }
  return response.json();
}
