"use client";

import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createTask } from "@/app/(app)/tasks/actions";
import type { TaskArea } from "@/lib/tasks";

export type CourseOption = { id: string; title: string };

/**
 * Direct task creation, no Inbox involved — a "+ Add task" button already
 * knows it's a task. Reused across every task-list surface: the plain
 * `/tasks` board and School's board (via `TaskBoard`), and Today's
 * "Due today" list (`area` differs, `defaultDueDate` is set only for the
 * latter so the new task actually lands in that due-date-bucketed view).
 * `courses` is only passed by School — a class only makes sense for a
 * school-area task, so the picker is omitted everywhere else.
 */
export function AddTaskForm({
  area,
  defaultDueDate,
  courses,
}: {
  area: TaskArea;
  defaultDueDate?: string | null;
  courses?: CourseOption[];
}) {
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState(defaultDueDate?.slice(0, 10) ?? "");
  const [courseId, setCourseId] = useState("");
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  function submit() {
    const value = title.trim();
    if (!value || isPending) return;

    startTransition(async () => {
      const result = await createTask({
        title: value,
        area,
        due_date: dueDate ? new Date(dueDate).toISOString() : null,
        course_id: courseId || null,
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setTitle("");
      setCourseId("");
      setDueDate(defaultDueDate?.slice(0, 10) ?? "");
      inputRef.current?.focus();
    });
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
      className="flex flex-wrap items-center gap-2"
    >
      <Input
        ref={inputRef}
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        placeholder="Add a task…"
        className="h-8 min-w-[10rem] flex-1 text-sm"
      />
      {courses && courses.length > 0 && (
        <Select value={courseId} onValueChange={(value) => setCourseId(value ?? "")}>
          <SelectTrigger className="h-8 w-[160px] text-sm">
            <SelectValue placeholder="Class (optional)" />
          </SelectTrigger>
          <SelectContent>
            {courses.map((course) => (
              <SelectItem key={course.id} value={course.id}>
                {course.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      <Input
        type="date"
        value={dueDate}
        onChange={(event) => setDueDate(event.target.value)}
        className="h-8 w-[150px] text-sm"
      />
      <Button type="submit" size="sm" disabled={!title.trim() || isPending}>
        {isPending ? "Adding…" : "Add"}
      </Button>
    </form>
  );
}
