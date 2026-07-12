"use client";

import { useDroppable } from "@dnd-kit/core";
import { TaskCard } from "./task-card";
import type { Task, TaskStatus } from "@/lib/tasks";

export function TaskColumn({
  status,
  label,
  tasks,
  onMove,
}: {
  status: TaskStatus;
  label: string;
  tasks: Task[];
  onMove: (taskId: string, status: TaskStatus) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div
      ref={setNodeRef}
      className={
        "border-border bg-muted/40 flex min-h-40 w-full flex-col gap-2 rounded-xl border p-3 " +
        (isOver ? "ring-ring ring-2" : "")
      }
    >
      <h2 className="text-muted-foreground text-sm font-semibold">
        {label} <span className="font-normal">({tasks.length})</span>
      </h2>
      <div className="flex flex-col gap-2">
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} onMove={onMove} />
        ))}
      </div>
    </div>
  );
}
