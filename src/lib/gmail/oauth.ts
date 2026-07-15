import { getGmailEnv } from "@/lib/env";
import {
  buildGoogleAuthUrl,
  exchangeCodeForTokens,
  refreshGoogleAccessToken,
  type GoogleTokenResponse,
} from "@/lib/google/oauth";

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

export type { GoogleTokenResponse as GmailTokenResponse };

export function buildGmailAuthUrl(options: {
  scopes: string[];
  state: string;
}): string {
  return buildGoogleAuthUrl({
    ...options,
    redirectUri: getGmailEnv().GMAIL_REDIRECT_URI,
  });
}

export async function exchangeGmailCodeForTokens(
  code: string,
): Promise<GoogleTokenResponse> {
  return exchangeCodeForTokens(code, getGmailEnv().GMAIL_REDIRECT_URI);
}

// Refresh doesn't need a redirect_uri (not part of the refresh_token grant),
// so the Calendar implementation is reused as-is.
export { refreshGoogleAccessToken as refreshGmailAccessToken };
