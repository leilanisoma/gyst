import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { SourceConfigForm } from "./source-config-form";
import { SourceConfigList, type SourceConfigRow } from "./source-config-list";
import type { AdapterId } from "@/lib/job-sources/types";

export async function SourcesSection() {
  const supabase = await createClient();
  const { data: sourceConfigs } = await supabase
    .from("source_configs")
    .select("id, adapter_id, label, enabled")
    .order("created_at", { ascending: true });

  type RunRow = {
    source_config_id: string;
    status: string;
    items_found: number;
    items_created: number;
    items_updated: number;
    items_expired: number;
    finished_at: string | null;
    error: string | null;
  };

  const ids = (sourceConfigs ?? []).map((s) => s.id);
  let runs: RunRow[] = [];
  if (ids.length > 0) {
    const { data } = await supabase
      .from("source_runs")
      .select(
        "source_config_id, status, items_found, items_created, items_updated, items_expired, finished_at, error, started_at",
      )
      .in("source_config_id", ids)
      .order("started_at", { ascending: false });
    runs = data ?? [];
  }

  const latestRunBySource = new Map<string, RunRow>();
  for (const run of runs) {
    if (!latestRunBySource.has(run.source_config_id)) {
      latestRunBySource.set(run.source_config_id, run);
    }
  }

  const rows: SourceConfigRow[] = (sourceConfigs ?? []).map((source) => {
    const run = latestRunBySource.get(source.id);
    return {
      id: source.id,
      adapterId: source.adapter_id as AdapterId,
      label: source.label,
      enabled: source.enabled,
      lastRun: run
        ? {
            status: run.status as "running" | "success" | "error",
            itemsFound: run.items_found,
            itemsCreated: run.items_created,
            itemsUpdated: run.items_updated,
            itemsExpired: run.items_expired,
            finishedAt: run.finished_at,
            error: run.error,
          }
        : null,
    };
  });

  return (
    <Card>
      <CardContent className="flex flex-col gap-3 py-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">
            Discovery sources
            <span className="text-muted-foreground font-normal">
              {" "}
              — ATS boards and curated feeds checked for new roles
            </span>
          </h2>
          <SourceConfigForm />
        </div>
        <SourceConfigList sources={rows} />
      </CardContent>
    </Card>
  );
}
