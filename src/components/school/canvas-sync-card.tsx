"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { syncCanvasNow } from "@/app/(app)/school/actions";

export function CanvasSyncCard({
  configured,
  status,
  lastSyncedAt,
  error,
}: {
  configured: boolean;
  status: "not_connected" | "connected" | "error";
  lastSyncedAt: string | null;
  error: string | null;
}) {
  const [isPending, startTransition] = useTransition();

  function syncNow() {
    startTransition(async () => {
      const result = await syncCanvasNow();
      if (!result.ok) toast.error(result.error);
      else
        toast.success(
          `Synced ${result.coursesUpserted} course${result.coursesUpserted === 1 ? "" : "s"}, ${result.assignmentsUpserted} assignment${result.assignmentsUpserted === 1 ? "" : "s"}.`,
        );
    });
  }

  if (!configured) {
    return (
      <Card>
        <CardContent className="flex flex-col gap-2 py-4">
          <h2 className="text-sm font-semibold">Canvas</h2>
          <p className="text-muted-foreground text-sm">
            Add CANVAS_BASE_URL and CANVAS_PERSONAL_ACCESS_TOKEN to your
            environment to sync courses and assignments.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-4 py-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold">Canvas</h2>
            <Badge variant={status === "error" ? "destructive" : "secondary"}>
              {status === "connected" ? "Synced" : status === "error" ? "Error" : "Not synced yet"}
            </Badge>
          </div>
          <p className="text-muted-foreground text-sm">
            {status === "error" && error
              ? error
              : lastSyncedAt
                ? `Last synced ${new Date(lastSyncedAt).toLocaleString()}`
                : "Sync to pull in courses, assignments, and deadlines."}
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={syncNow} disabled={isPending}>
          {isPending ? "Syncing…" : "Sync now"}
        </Button>
      </CardContent>
    </Card>
  );
}
