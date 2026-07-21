import { NextResponse, type NextRequest } from "next/server";
import { getCronEnv } from "@/lib/env";
import { createServiceClient } from "@/lib/supabase/service";
import { runGoogleSync } from "@/lib/google/sync";

/** Supabase pg_cron calls this nightly (see `docs/PHASES/phase-11.md`) — same bearer-secret auth as the other cron routes. */
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

  const result = await runGoogleSync(supabase, profile.id);
  return NextResponse.json(result);
}
