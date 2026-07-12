import { NextResponse, type NextRequest } from "next/server";
import { getCronEnv } from "@/lib/env";
import { createServiceClient } from "@/lib/supabase/service";
import { runAllDiscovery } from "@/lib/job-sources/run-discovery";

/**
 * Vercel Cron (see `vercel.json`) calls this daily with the configured
 * `CRON_SECRET` as a bearer token — the only auth this route needs, since
 * there's no user session in a scheduled job. Runs every enabled
 * `source_configs` row for the single allowed user via the service-role
 * client, which bypasses RLS the same way a user session normally scopes
 * requests.
 */
export async function GET(request: NextRequest) {
  const env = getCronEnv();
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();
  const { data: profile } = await supabase.from("profiles").select("id").limit(1).maybeSingle();
  if (!profile) {
    return NextResponse.json({ error: "No profile found" }, { status: 500 });
  }

  const summaries = await runAllDiscovery(supabase, profile.id);
  return NextResponse.json({ ok: true, summaries });
}
