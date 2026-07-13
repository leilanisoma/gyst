"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { logActualMinutes } from "@/app/(app)/school/work-estimate-actions";

export type ActualTimeLogRow = {
  taskId: string;
  title: string;
  predictedMinutes: number | null;
};

function ActualTimeRow({ taskId, title, predictedMinutes }: ActualTimeLogRow) {
  const [minutes, setMinutes] = useState("");
  const [isPending, startTransition] = useTransition();

  function save() {
    const parsed = Number(minutes);
    startTransition(async () => {
      const result = await logActualMinutes(taskId, parsed);
      if (!result.ok) toast.error(result.error);
      else toast.success("Logged.");
    });
  }

  return (
    <li className="flex items-center justify-between gap-3 text-sm">
      <div className="flex flex-col">
        <span>{title}</span>
        <span className="text-muted-foreground text-xs">
          {predictedMinutes != null ? `Predicted ${predictedMinutes} min` : "No estimate on record"}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <Input
          type="number"
          min={1}
          value={minutes}
          onChange={(event) => setMinutes(event.target.value)}
          placeholder="Actual min"
          className="h-8 w-28"
        />
        <Button size="sm" disabled={isPending || !minutes} onClick={save}>
          Save
        </Button>
      </div>
    </li>
  );
}

/** PLAN.md §15 task 6.8 — actual-time feedback, so a future estimator version can calibrate against `estimator_version: "v1"`'s real accuracy. */
export function ActualTimeLog({ rows }: { rows: ActualTimeLogRow[] }) {
  if (rows.length === 0) return null;

  return (
    <Card>
      <CardContent className="flex flex-col gap-3 py-4">
        <h2 className="text-sm font-semibold">
          How long did that actually take?
          <span className="text-muted-foreground font-normal"> — completed school work, no time logged yet</span>
        </h2>
        <ul className="flex flex-col gap-2">
          {rows.map((row) => (
            <ActualTimeRow key={row.taskId} {...row} />
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
