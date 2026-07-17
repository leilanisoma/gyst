"use client";

import { useState } from "react";
import { useDraggable } from "@dnd-kit/core";
import { MoreVertical } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TaskEditSheet } from "./task-edit-sheet";
import {
  TASK_STATUSES,
  TASK_STATUS_LABELS,
  type Task,
  type TaskStatus,
} from "@/lib/tasks";

export function TaskCard({
  task,
  onMove,
}: {
  task: Task;
  onMove: (taskId: string, status: TaskStatus) => void;
}) {
  const [editing, setEditing] = useState(false);
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: task.id });

  return (
    <div
      ref={setNodeRef}
      style={
        transform
          ? {
              transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
            }
          : undefined
      }
      className={
        "border-border bg-card hover:shadow-cozy flex flex-col gap-2 rounded-lg border p-3 text-sm shadow-sm transition-[transform,box-shadow] duration-[var(--motion-duration-fast)] ease-[var(--motion-ease-out)] hover:scale-[1.015] active:scale-[0.985] " +
        (isDragging ? "z-10 opacity-70" : "")
      }
    >
      <div className="flex items-start justify-between gap-2">
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="text-left font-medium hover:underline"
        >
          {task.title}
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="ghost" size="icon-sm" aria-label="Move task" />
            }
          >
            <MoreVertical className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {TASK_STATUSES.map((status) => (
              <DropdownMenuItem
                key={status}
                disabled={status === task.status}
                onClick={() => onMove(task.id, status)}
              >
                Move to {TASK_STATUS_LABELS[status]}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="text-muted-foreground flex flex-wrap items-center gap-1.5 text-xs">
        <Badge variant="secondary">{task.area}</Badge>
        {task.due_date && (
          <span>{new Date(task.due_date).toLocaleDateString()}</span>
        )}
        {task.estimated_minutes && <span>{task.estimated_minutes}m</span>}
      </div>
      <button
        type="button"
        {...listeners}
        {...attributes}
        aria-label="Drag to reorder"
        className="text-muted-foreground/60 cursor-grab self-start text-xs active:cursor-grabbing"
      >
        ⠿ drag
      </button>
      <TaskEditSheet task={task} open={editing} onOpenChange={setEditing} />
    </div>
  );
}
