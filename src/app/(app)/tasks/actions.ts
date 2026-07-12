"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { TaskPriority, TaskStatus } from "@/lib/tasks";

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function updateTaskStatus(
  taskId: string,
  status: TaskStatus,
): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("tasks")
    .update({ status })
    .eq("id", taskId);

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/tasks");
  return { ok: true };
}

export type TaskEditInput = {
  title: string;
  notes: string | null;
  area: string;
  priority: TaskPriority;
  due_date: string | null;
  estimated_minutes: number | null;
};

export async function updateTask(
  taskId: string,
  input: TaskEditInput,
): Promise<ActionResult> {
  if (!input.title.trim()) {
    return { ok: false, error: "Title can't be empty." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("tasks")
    .update({
      title: input.title.trim(),
      notes: input.notes,
      area: input.area,
      priority: input.priority,
      due_date: input.due_date,
      estimated_minutes: input.estimated_minutes,
    })
    .eq("id", taskId);

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/tasks");
  return { ok: true };
}
