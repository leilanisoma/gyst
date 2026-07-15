import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/gmail/client";
import {
  markGmailConnected,
  markGmailError,
} from "@/lib/gmail/integration";
import { connectGmailTokens } from "@/lib/gmail/tokens";
import { STATE_COOKIE } from "../connect/route";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const settingsUrl = new URL("/settings", origin);

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) {
    return NextResponse.redirect(new URL("/login", origin));
  }

  const cookieStore = await cookies();
  const expectedState = cookieStore.get(STATE_COOKIE)?.value;
  cookieStore.delete(STATE_COOKIE);

  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const oauthError = searchParams.get("error");

  if (oauthError) {
    settingsUrl.searchParams.set("gmail", "error");
    settingsUrl.searchParams.set("reason", oauthError);
    return NextResponse.redirect(settingsUrl);
  }

  if (!code || !state || !expectedState || state !== expectedState) {
    settingsUrl.searchParams.set("gmail", "error");
    settingsUrl.searchParams.set("reason", "invalid_state");
    return NextResponse.redirect(settingsUrl);
  }

  try {
    const { scope, accessToken } = await connectGmailTokens(
      supabase,
      user.id,
      code,
    );
    const profile = await getProfile(accessToken);
    await markGmailConnected(supabase, user.id, {
      scope,
      accountEmail: profile.emailAddress,
    });
  } catch (error) {
    await markGmailError(
      supabase,
      user.id,
      error instanceof Error
        ? error.message
        : "Unknown error connecting Gmail.",
    );
    settingsUrl.searchParams.set("gmail", "error");
    settingsUrl.searchParams.set("reason", "connect_failed");
    return NextResponse.redirect(settingsUrl);
  }

  settingsUrl.searchParams.set("gmail", "connected");
  return NextResponse.redirect(settingsUrl);
}
