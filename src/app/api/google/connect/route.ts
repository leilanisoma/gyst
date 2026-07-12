import { randomBytes } from "crypto";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { buildGoogleAuthUrl, GOOGLE_SCOPES } from "@/lib/google/oauth";

export const STATE_COOKIE = "g_oauth_state";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const { searchParams } = new URL(request.url);
  const requestWriteScope = searchParams.get("scope") === "write";

  const scopes = [GOOGLE_SCOPES.calendarReadonly];
  if (requestWriteScope) scopes.push(GOOGLE_SCOPES.calendarAppCreated);

  const state = randomBytes(16).toString("hex");
  const cookieStore = await cookies();
  cookieStore.set(STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });

  const authUrl = buildGoogleAuthUrl({ scopes, state });
  return NextResponse.redirect(authUrl);
}
