"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  deleteAllCycleObservationsData,
  deleteCycleObservationEntry,
  importCycleObservationsCsv,
} from "@/app/(app)/wellness/actions";
import type { CycleObservation } from "@/lib/health/cycle-observations";

const CSV_PLACEHOLDER =
  "date,flow,symptoms,note\n2026-07-01,medium,cramps;fatigue,\n2026-07-02,light,,";

/**
 * Manual/CSV import (PLAN.md §8) — kept separate from wellness_check_ins:
 * its own opt-in section, its own deletion control (PLAN.md §11
 * "separate permissions and deletion controls"). Highly sensitive tier
 * per docs/DATA_CLASSIFICATION.md.
 */
export function CycleImportCard({
  observations,
}: {
  observations: CycleObservation[];
}) {
  const [csvText, setCsvText] = useState("");
  const [isPending, startTransition] = useTransition();

  function importCsv() {
    if (!csvText.trim()) return;
    startTransition(async () => {
      const result = await importCycleObservationsCsv(csvText);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      if (result.errors.length > 0) {
        toast.warning(
          `Imported ${result.imported}, skipped ${result.errors.length}: ${result.errors[0]}`,
        );
      } else {
        toast.success(`Imported ${result.imported} observation(s).`);
      }
      setCsvText("");
    });
  }

  function removeOne(id: string) {
    if (!window.confirm("Delete this observation? This can't be undone.")) return;
    startTransition(async () => {
      const result = await deleteCycleObservationEntry(id);
      if (!result.ok) toast.error(result.error);
      else toast.success("Observation deleted.");
    });
  }

  function deleteAll() {
    if (
      !window.confirm(
        "Delete every stored cycle observation? This can't be undone.",
      )
    ) {
      return;
    }
    startTransition(async () => {
      const result = await deleteAllCycleObservationsData();
      if (!result.ok) toast.error(result.error);
      else toast.success("All cycle data deleted.");
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-muted-foreground text-xs">
        Optional and separate from the check-in above. No period-tracking
        app has an authorized export/API wired up yet (PLAN.md §8), so this
        only accepts a CSV you paste in yourself —{" "}
        <code>date,flow,symptoms,note</code>, one row per day.
      </p>

      <Textarea
        value={csvText}
        onChange={(event) => setCsvText(event.target.value)}
        placeholder={CSV_PLACEHOLDER}
        rows={4}
        className="font-mono text-xs"
      />
      <Button
        size="sm"
        variant="outline"
        disabled={isPending || !csvText.trim()}
        onClick={importCsv}
        className="self-start"
      >
        Import CSV
      </Button>

      {observations.length > 0 && (
        <div className="flex flex-col gap-2 border-t pt-3">
          <h3 className="text-sm font-medium">
            {observations.length} observation{observations.length === 1 ? "" : "s"}{" "}
            stored
          </h3>
          <ul className="flex flex-col gap-1">
            {observations.slice(0, 10).map((observation) => (
              <li
                key={observation.id}
                className="flex items-center justify-between gap-2 text-xs"
              >
                <span>
                  {observation.observation_date}
                  {observation.on_period ? " · on period" : ""}
                  {observation.flow ? ` · ${observation.flow}` : ""}
                  {observation.symptoms.length > 0
                    ? ` · ${observation.symptoms.join(", ")}`
                    : ""}
                  {observation.lh != null ? ` · LH ${observation.lh}` : ""}
                  {observation.fsh != null ? ` · FSH ${observation.fsh}` : ""}
                  {observation.e3g != null ? ` · E3G ${observation.e3g}` : ""}
                  {observation.pdg != null ? ` · PdG ${observation.pdg}` : ""}
                </span>
                <button
                  type="button"
                  onClick={() => removeOne(observation.id)}
                  className="text-muted-foreground hover:text-destructive"
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
          <Button
            size="sm"
            variant="destructive"
            disabled={isPending}
            onClick={deleteAll}
            className="w-fit"
          >
            Delete all cycle data
          </Button>
        </div>
      )}
    </div>
  );
}
