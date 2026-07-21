"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateWeeklyApplicationGoal } from "@/app/(app)/recruiting/actions";
import type { WeeklyGoalProgress } from "@/lib/recruiting-analytics";

const FILL_BY_PACE: Record<WeeklyGoalProgress["pace"], string> = {
  ahead: "bg-primary",
  on_track: "bg-primary",
  behind: "bg-amber-500",
};

/**
 * Dataviz skill: "a single ratio against a limit" is a Meter, not a chart —
 * fill carries the pace (on/ahead vs behind), track is a lighter neutral
 * step so the state reads across the whole bar at a glance.
 */
export function WeeklyGoalMeter({ progress }: { progress: WeeklyGoalProgress }) {
  const [editing, setEditing] = useState(false);
  const [goalInput, setGoalInput] = useState(String(progress.goal));
  const [isPending, startTransition] = useTransition();

  const pct = Math.min(100, (progress.actual / progress.goal) * 100);

  function save() {
    const goal = Number(goalInput);
    startTransition(async () => {
      const result = await updateWeeklyApplicationGoal(goal);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setEditing(false);
    });
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between text-xs">
        <p className="text-muted-foreground">
          This week&rsquo;s goal
          <span className="text-foreground ml-1 font-medium">
            {progress.actual}/{progress.goal} applied
          </span>
        </p>
        {editing ? (
          <div className="flex items-center gap-1">
            <Input
              type="number"
              min={1}
              max={50}
              value={goalInput}
              onChange={(e) => setGoalInput(e.target.value)}
              className="h-6 w-14 px-1 text-xs"
            />
            <Button size="sm" className="h-6 px-2 text-xs" onClick={save} disabled={isPending}>
              Save
            </Button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="text-muted-foreground underline underline-offset-2 hover:text-foreground"
          >
            edit goal
          </button>
        )}
      </div>
      <div className="bg-muted h-2 w-full rounded-full" role="img" aria-label={`${progress.actual} of ${progress.goal} applications this week`}>
        <div
          className={`h-2 rounded-full ${FILL_BY_PACE[progress.pace]}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
