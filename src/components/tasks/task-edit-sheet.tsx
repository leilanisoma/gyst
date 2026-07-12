"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { updateTask } from "@/app/(app)/tasks/actions";
import { TASK_AREAS, TASK_PRIORITIES, type Task } from "@/lib/tasks";

export function TaskEditSheet({
  task,
  open,
  onOpenChange,
}: {
  task: Task;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [title, setTitle] = useState(task.title);
  const [notes, setNotes] = useState(task.notes ?? "");
  const [area, setArea] = useState(task.area);
  const [priority, setPriority] = useState(task.priority);
  const [dueDate, setDueDate] = useState(
    task.due_date ? task.due_date.slice(0, 10) : "",
  );
  const [minutes, setMinutes] = useState(
    task.estimated_minutes?.toString() ?? "",
  );
  const [isPending, startTransition] = useTransition();

  function save() {
    startTransition(async () => {
      const result = await updateTask(task.id, {
        title,
        notes: notes.trim() ? notes : null,
        area,
        priority,
        due_date: dueDate ? new Date(dueDate).toISOString() : null,
        estimated_minutes: minutes ? Number(minutes) : null,
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      onOpenChange(false);
    });
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-96 flex-col gap-4 p-4">
        <SheetHeader>
          <SheetTitle>Edit task</SheetTitle>
        </SheetHeader>
        <div className="flex flex-col gap-3 px-1">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="task-title">Title</Label>
            <Input
              id="task-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="task-notes">Notes</Label>
            <Textarea
              id="task-notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={3}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Area</Label>
            <Select
              value={area}
              onValueChange={(value) => value && setArea(value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TASK_AREAS.map((value) => (
                  <SelectItem key={value} value={value}>
                    {value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Priority</Label>
            <Select
              value={priority}
              onValueChange={(value) =>
                value && setPriority(value as (typeof TASK_PRIORITIES)[number])
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TASK_PRIORITIES.map((value) => (
                  <SelectItem key={value} value={value}>
                    {value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="task-due">Due date</Label>
            <Input
              id="task-due"
              type="date"
              value={dueDate}
              onChange={(event) => setDueDate(event.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="task-minutes">Estimated minutes</Label>
            <Input
              id="task-minutes"
              type="number"
              min={0}
              value={minutes}
              onChange={(event) => setMinutes(event.target.value)}
            />
          </div>
        </div>
        <SheetFooter>
          <Button onClick={save} disabled={isPending || !title.trim()}>
            {isPending ? "Saving…" : "Save"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
