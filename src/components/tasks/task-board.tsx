"use client";

import { useState } from "react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { toast } from "sonner";
import { TaskColumn } from "./task-column";
import { updateTaskStatus } from "@/app/(app)/tasks/actions";
import {
  TASK_STATUS_LABELS,
  TASK_STATUSES,
  type Task,
  type TaskStatus,
} from "@/lib/tasks";

export function TaskBoard({ tasks: serverTasks }: { tasks: Task[] }) {
  const [prevServerTasks, setPrevServerTasks] = useState(serverTasks);
  const [tasks, setTasks] = useState(serverTasks);

  if (serverTasks !== prevServerTasks) {
    setPrevServerTasks(serverTasks);
    setTasks(serverTasks);
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor),
  );

  function moveTask(taskId: string, newStatus: TaskStatus) {
    const task = tasks.find((t) => t.id === taskId);
    if (!task || task.status === newStatus) return;

    const previousStatus = task.status;
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t)),
    );

    void updateTaskStatus(taskId, newStatus).then((result) => {
      if (!result.ok) {
        toast.error(result.error);
        setTasks((prev) =>
          prev.map((t) =>
            t.id === taskId ? { ...t, status: previousStatus } : t,
          ),
        );
        return;
      }
      toast(`Moved to ${TASK_STATUS_LABELS[newStatus]}`, {
        action: {
          label: "Undo",
          onClick: () => {
            setTasks((prev) =>
              prev.map((t) =>
                t.id === taskId ? { ...t, status: previousStatus } : t,
              ),
            );
            void updateTaskStatus(taskId, previousStatus);
          },
        },
      });
    });
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;
    moveTask(active.id as string, over.id as TaskStatus);
  }

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="grid gap-4 md:grid-cols-3">
        {TASK_STATUSES.map((status) => (
          <TaskColumn
            key={status}
            status={status}
            label={TASK_STATUS_LABELS[status]}
            tasks={tasks.filter((t) => t.status === status)}
            onMove={moveTask}
          />
        ))}
      </div>
    </DndContext>
  );
}
