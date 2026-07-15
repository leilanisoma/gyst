import { NextResponse, type NextRequest } from "next/server";
import { getCronEnv, isGmailConfigured } from "@/lib/env";
import { createServiceClient } from "@/lib/supabase/service";
import { runGmailSync } from "@/lib/gmail/sync";

/** Vercel Cron (see `vercel.json`) calls this daily — same bearer-secret auth as /api/cron/sync-canvas. */
export async function GET(request: NextRequest) {
  const env = getCronEnv();
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isGmailConfigured()) {
    return NextResponse.json({ ok: true, skipped: "Gmail not configured" });
  }

  const supabase = createServiceClient();
  const { data: profile } = await supabase.from("profiles").select("id").limit(1).maybeSingle();
  if (!profile) {
    return NextResponse.json({ error: "No profile found" }, { status: 500 });
  }

  const result = await runGmailSync(supabase, profile.id);
  return NextResponse.json(result);
}
