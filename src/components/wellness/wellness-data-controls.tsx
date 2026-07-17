"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { deleteAllWellnessData, exportWellnessData } from "@/app/(app)/wellness/actions";

/** Granular visibility lives in WellnessHistory; this is the export/delete-everything pair (docs/DATA_CLASSIFICATION.md). */
export function WellnessDataControls() {
  const [isPending, startTransition] = useTransition();

  function exportData() {
    startTransition(async () => {
      const result = await exportWellnessData();
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      const blob = new Blob(
        [
          JSON.stringify(
            { exported_at: result.exported_at, check_ins: result.check_ins },
            null,
            2,
          ),
        ],
        { type: "application/json" },
      );
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `gyst-wellness-export-${result.exported_at.slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success("Wellness data exported.");
    });
  }

  function deleteAll() {
    if (
      !window.confirm(
        "Delete every stored wellness check-in? This can't be undone.",
      )
    ) {
      return;
    }
    startTransition(async () => {
      const result = await deleteAllWellnessData();
      if (!result.ok) toast.error(result.error);
      else toast.success("All wellness check-ins deleted.");
    });
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button size="sm" variant="outline" disabled={isPending} onClick={exportData}>
        Export as JSON
      </Button>
      <Button size="sm" variant="destructive" disabled={isPending} onClick={deleteAll}>
        Delete all wellness data
      </Button>
    </div>
  );
}
