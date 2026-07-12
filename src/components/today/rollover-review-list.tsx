"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TaskEditSheet } from "@/components/tasks/task-edit-sheet";
import {
  deleteTask,
  reduceTaskScope,
  rescheduleTaskToNextSlot,
} from "@/app/(app)/tasks/actions";
import { isFirstMiss } from "@/lib/rollover";
import type { Task } from "@/lib/tasks";

function RolloverRow({ task }: { task: Task }) {
  const [editing, setEditing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const firstMiss = isFirstMiss(task);

  function reschedule() {
    startTransition(async () => {
      const result = await rescheduleTaskToNextSlot(task.id);
      if (!result.ok) toast.error(result.error);
      else toast.success("Pushed to the next feasible slot.");
    });
  }

  function reduce() {
    startTransition(async () => {
      const result = await reduceTaskScope(task.id);
      if (!result.ok) toast.error(result.error);
      else toast.success("Scope reduced.");
    });
  }

  function remove() {
    startTransition(async () => {
      const result = await deleteTask(task.id);
      if (!result.ok) toast.error(result.error);
    });
  }

  return (
    <li className="border-border bg-card flex flex-col gap-2 rounded-lg border p-3 text-sm">
      <div className="flex items-center justify-between gap-2">
        <span className="min-w-0 truncate font-medium">{task.title}</span>
        <Badge variant="secondary">{task.area}</Badge>
      </div>
      {firstMiss ? (
        <>
          <p className="text-muted-foreground text-xs">
            First time this slipped.
          </p>
          <Button size="sm" onClick={reschedule} disabled={isPending}>
            Push to next feasible slot
          </Button>
        </>
      ) : (
        <>
          <p className="text-muted-foreground text-xs">
            Slipped {task.rollover_count} time
            {task.rollover_count === 1 ? "" : "s"} — what next?
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={reduce}
              disabled={isPending}
            >
              Reduce scope
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setEditing(true)}
              disabled={isPending}
            >
              Break down
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={reschedule}
              disabled={isPending}
            >
              Reschedule
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={remove}
              disabled={isPending}
            >
              Delete
            </Button>
          </div>
        </>
      )}
      <TaskEditSheet task={task} open={editing} onOpenChange={setEditing} />
    </li>
  );
}

export function RolloverReviewList({ tasks }: { tasks: Task[] }) {
  if (tasks.length === 0) {
    return <p className="text-muted-foreground text-sm">Nothing overdue.</p>;
  }

  return (
    <ul className="flex flex-col gap-2">
      {tasks.map((task) => (
        <RolloverRow key={task.id} task={task} />
      ))}
    </ul>
  );
}
