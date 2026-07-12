"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  checkSourceHealth,
  deleteSourceConfig,
  runDiscoveryNow,
  setSourceConfigEnabled,
} from "@/app/(app)/recruiting/sources-actions";
import type { AdapterId } from "@/lib/job-sources/types";

export type SourceConfigRow = {
  id: string;
  adapterId: AdapterId;
  label: string;
  enabled: boolean;
  lastRun: {
    status: "running" | "success" | "error";
    itemsFound: number;
    itemsCreated: number;
    itemsUpdated: number;
    itemsExpired: number;
    finishedAt: string | null;
    error: string | null;
  } | null;
};

export function SourceConfigList({ sources }: { sources: SourceConfigRow[] }) {
  const [isPending, startTransition] = useTransition();

  function runAll() {
    startTransition(async () => {
      const result = await runDiscoveryNow();
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      const created = result.summaries.reduce((sum, s) => sum + s.itemsCreated, 0);
      const errors = result.summaries.filter((s) => s.status === "error");
      if (errors.length > 0) {
        toast.error(`${errors.length} source(s) failed: ${errors.map((e) => e.label).join(", ")}`);
      }
      toast.success(`Discovery run complete — ${created} new opportunit${created === 1 ? "y" : "ies"} found.`);
    });
  }

  function toggle(id: string, enabled: boolean) {
    startTransition(async () => {
      const result = await setSourceConfigEnabled(id, enabled);
      if (!result.ok) toast.error(result.error);
    });
  }

  function remove(id: string) {
    startTransition(async () => {
      const result = await deleteSourceConfig(id);
      if (!result.ok) toast.error(result.error);
    });
  }

  function checkHealth(id: string) {
    startTransition(async () => {
      const result = await checkSourceHealth(id);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      if (result.health.ok) {
        toast.success(result.health.message);
      } else {
        toast.error(result.health.message);
      }
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground text-sm">
          {sources.length} source{sources.length === 1 ? "" : "s"} configured
        </p>
        <Button size="sm" onClick={runAll} disabled={isPending || sources.length === 0}>
          Run discovery now
        </Button>
      </div>
      {sources.length === 0 ? (
        <p className="text-muted-foreground text-sm">No discovery sources yet.</p>
      ) : (
        <div className="flex flex-col divide-y">
          {sources.map((source) => (
            <div key={source.id} className="flex items-center justify-between gap-3 py-2">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={source.enabled}
                  onCheckedChange={(checked) => toggle(source.id, checked === true)}
                />
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{source.label}</span>
                  <span className="text-muted-foreground text-xs">
                    {source.adapterId}
                    {source.lastRun && (
                      <>
                        {" · "}
                        {source.lastRun.status === "error" ? (
                          <span className="text-destructive">failed: {source.lastRun.error}</span>
                        ) : (
                          <>
                            found {source.lastRun.itemsFound}, new {source.lastRun.itemsCreated},
                            expired {source.lastRun.itemsExpired}
                          </>
                        )}
                      </>
                    )}
                  </span>
                </div>
                {source.lastRun?.status === "error" && <Badge variant="destructive">broken</Badge>}
              </div>
              <div className="flex items-center gap-1">
                <Button size="sm" variant="ghost" onClick={() => checkHealth(source.id)} disabled={isPending}>
                  Check health
                </Button>
                <Button size="sm" variant="ghost" onClick={() => remove(source.id)} disabled={isPending}>
                  Remove
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
