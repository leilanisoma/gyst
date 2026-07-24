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
import { AddTaskForm, type CourseOption } from "./add-task-form";
import { updateTaskStatus } from "@/app/(app)/tasks/actions";
import { logActualMinutes } from "@/app/(app)/school/work-estimate-actions";
import {
  TASK_STATUS_LABELS,
  TASK_STATUSES,
  type Task,
  type TaskArea,
  type TaskStatus,
} from "@/lib/tasks";

export function TaskBoard({
  tasks: serverTasks,
  area = "general",
  courses,
  instanceId = area,
}: {
  tasks: Task[];
  /** Which area new tasks get tagged with via the "+ Add task" form — `/tasks` (unfiltered, cross-area) defaults to "general"; School passes "school" so tasks it creates actually show up in its own filtered board. */
  area?: TaskArea;
  /** Only passed by School — enables the class picker on the add-task form. */
  courses?: CourseOption[];
  /**
   * Stable id for `DndContext`'s internal a11y announcements. dnd-kit
   * otherwise assigns these from a module-level counter, which drifts
   * between the server and client render passes whenever `TaskBoard` mounts
   * more than once on the same page (School renders one copy in the
   * desktop tab rail and one in the mobile accordion fallback,
   * simultaneously in the DOM) — that drift is a real hydration mismatch,
   * not a false positive, so each mounted copy needs its own fixed id.
   */
  instanceId?: string;
}) {
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

      promptForActualMinutes(task, taskId);
    });
  }

  /**
   * Replaces the old standalone "Actual time log" review tab — the moment
   * a Canvas-sourced task (one with a predicted estimate and no actual time
   * logged yet) gets marked completed is the natural point to ask, instead
   * of making the user visit a separate list later. Plain `window.prompt`
   * on purpose: this is a single optional number, not worth a whole dialog
   * component for a single-user app. Feeds `calibrateEstimateMinutes`
   * (`src/lib/canvas/estimate.ts`) on the next Canvas sync.
   */
  function promptForActualMinutes(task: Task, taskId: string) {
    if (task.predicted_minutes == null || task.actual_minutes != null) return;

    const input = window.prompt(
      `How long did "${task.title}" actually take? (minutes — predicted ${task.predicted_minutes})`,
    );
    if (!input) return;

    const minutes = Math.round(Number(input));
    if (!Number.isFinite(minutes) || minutes <= 0) {
      toast.error("Enter a positive number of minutes.");
      return;
    }

    void logActualMinutes(taskId, minutes).then((result) => {
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, actual_minutes: minutes } : t)),
      );
      toast.success("Logged — future estimates for this kind of work will adjust.");
    });
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;
    moveTask(active.id as string, over.id as TaskStatus);
  }

  return (
    <div className="flex flex-col gap-4">
      <AddTaskForm area={area} courses={courses} />
      <DndContext id={instanceId} sensors={sensors} onDragEnd={handleDragEnd}>
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
    </div>
  );
}
