import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createGystCalendar, listCalendars } from "@/lib/google/calendar";
import {
  getGoogleIntegration,
  markGoogleConnected,
  markGoogleError,
  updateGoogleSettings,
} from "@/lib/google/integration";
import { GOOGLE_SCOPES } from "@/lib/google/oauth";
import { connectGoogleTokens } from "@/lib/google/tokens";
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
    settingsUrl.searchParams.set("google", "error");
    settingsUrl.searchParams.set("reason", oauthError);
    return NextResponse.redirect(settingsUrl);
  }

  if (!code || !state || !expectedState || state !== expectedState) {
    settingsUrl.searchParams.set("google", "error");
    settingsUrl.searchParams.set("reason", "invalid_state");
    return NextResponse.redirect(settingsUrl);
  }

  try {
    const { scope, accessToken } = await connectGoogleTokens(
      supabase,
      user.id,
      code,
    );
    const calendars = await listCalendars(accessToken);
    const primary = calendars.find((cal) => cal.primary);
    await markGoogleConnected(supabase, user.id, {
      scope,
      accountEmail: primary?.id ?? user.email ?? "",
    });

    const grantedWriteScope = scope
      .split(" ")
      .includes(GOOGLE_SCOPES.calendarAppCreated);
    const integration = await getGoogleIntegration(supabase, user.id);
    if (grantedWriteScope && !integration?.settings.gyst_calendar_id) {
      const gystCalendar = await createGystCalendar(accessToken);
      await updateGoogleSettings(supabase, user.id, {
        gyst_calendar_id: gystCalendar.id,
      });
    }
  } catch (error) {
    await markGoogleError(
      supabase,
      user.id,
      error instanceof Error
        ? error.message
        : "Unknown error connecting Google.",
    );
    settingsUrl.searchParams.set("google", "error");
    settingsUrl.searchParams.set("reason", "connect_failed");
    return NextResponse.redirect(settingsUrl);
  }

  settingsUrl.searchParams.set("google", "connected");
  return NextResponse.redirect(settingsUrl);
}
