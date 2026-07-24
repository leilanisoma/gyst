"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  deleteAllHealthDailySummariesData,
  deleteHealthDailySummaryEntry,
  upsertHealthDailySummary,
} from "@/app/(app)/wellness/actions";
import type { DailySummary } from "@/lib/health/daily-summaries";

function toNumberOrNull(value: string): number | null {
  if (!value.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

/**
 * Manual entry for Apple Watch metrics — replaces the native HealthKit sync
 * Phase 9B originally planned (no Apple Developer Program enrollment, see
 * docs/PHASES/phase-9.md). Same allowlisted fields, just typed in here
 * instead of synced from a device.
 */
export function HealthSummaryForm({
  dateString,
  summaries,
}: {
  dateString: string;
  summaries: DailySummary[];
}) {
  const [date, setDate] = useState(dateString);
  const [sleepMinutes, setSleepMinutes] = useState("");
  const [steps, setSteps] = useState("");
  const [activeEnergyKcal, setActiveEnergyKcal] = useState("");
  const [workoutMinutes, setWorkoutMinutes] = useState("");
  const [isPending, startTransition] = useTransition();

  function reset() {
    setDate(dateString);
    setSleepMinutes("");
    setSteps("");
    setActiveEnergyKcal("");
    setWorkoutMinutes("");
  }

  function save() {
    startTransition(async () => {
      const result = await upsertHealthDailySummary({
        date,
        sleep_minutes: toNumberOrNull(sleepMinutes),
        steps: toNumberOrNull(steps),
        active_energy_kcal: toNumberOrNull(activeEnergyKcal),
        workout_minutes: toNumberOrNull(workoutMinutes),
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Entry saved.");
      reset();
    });
  }

  function removeOne(id: string) {
    if (!window.confirm("Delete this entry? This can't be undone.")) return;
    startTransition(async () => {
      const result = await deleteHealthDailySummaryEntry(id);
      if (!result.ok) toast.error(result.error);
      else toast.success("Entry deleted.");
    });
  }

  function deleteAll() {
    if (
      !window.confirm(
        "Delete every logged health entry (sleep, steps, energy, workouts)? This can't be undone.",
      )
    ) {
      return;
    }
    startTransition(async () => {
      const result = await deleteAllHealthDailySummariesData();
      if (!result.ok) toast.error(result.error);
      else toast.success("All health entries deleted.");
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-muted-foreground text-xs">
        No native iPhone companion exists — Apple Watch data (steps, sleep,
        active energy, workout minutes) is logged here by hand for a given
        day.
      </p>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="health-summary-date">Date</Label>
        <Input
          id="health-summary-date"
          type="date"
          value={date}
          onChange={(event) => setDate(event.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="health-summary-sleep">Sleep (minutes)</Label>
          <Input
            id="health-summary-sleep"
            type="number"
            min={0}
            value={sleepMinutes}
            onChange={(event) => setSleepMinutes(event.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="health-summary-steps">Steps</Label>
          <Input
            id="health-summary-steps"
            type="number"
            min={0}
            value={steps}
            onChange={(event) => setSteps(event.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="health-summary-energy">Active energy (kcal)</Label>
          <Input
            id="health-summary-energy"
            type="number"
            min={0}
            value={activeEnergyKcal}
            onChange={(event) => setActiveEnergyKcal(event.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="health-summary-workout">Workout (minutes)</Label>
          <Input
            id="health-summary-workout"
            type="number"
            min={0}
            value={workoutMinutes}
            onChange={(event) => setWorkoutMinutes(event.target.value)}
          />
        </div>
      </div>

      <Button onClick={save} disabled={isPending} size="sm" className="self-start">
        {isPending ? "Saving…" : "Log entry"}
      </Button>

      {summaries.length > 0 && (
        <div className="flex flex-col gap-2 border-t pt-3">
          <h3 className="text-sm font-medium">
            {summaries.length} {summaries.length === 1 ? "entry" : "entries"} stored
          </h3>
          <ul className="flex flex-col gap-1">
            {summaries.slice(0, 10).map((summary) => (
              <li
                key={summary.id}
                className="flex items-center justify-between gap-2 text-xs"
              >
                <span>
                  {summary.date}
                  {summary.steps != null ? ` · ${summary.steps} steps` : ""}
                  {summary.sleep_minutes != null
                    ? ` · ${summary.sleep_minutes} min sleep`
                    : ""}
                </span>
                <button
                  type="button"
                  onClick={() => removeOne(summary.id)}
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
            Delete all health entries
          </Button>
        </div>
      )}
    </div>
  );
}
