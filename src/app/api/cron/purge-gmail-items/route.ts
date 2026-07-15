import { NextResponse, type NextRequest } from "next/server";
import { getCronEnv } from "@/lib/env";
import { createServiceClient } from "@/lib/supabase/service";

/**
 * Deletes gmail_items past their retention window (PLAN.md §15 task 7.8 —
 * "narrow retention, no full mailbox storage"). Vercel Cron (see
 * `vercel.json`) calls this daily — same bearer-secret auth as the other
 * cron routes.
 */
export async function GET(request: NextRequest) {
  const env = getCronEnv();
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();
  const { count, error } = await supabase
    .from("gmail_items")
    .delete({ count: "exact" })
    .lt("expires_at", new Date().toISOString());

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, purged: count ?? 0 });
}
