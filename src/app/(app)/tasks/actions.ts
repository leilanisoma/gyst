"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { logXpEvent } from "@/lib/gamification-log";
import {
  nextFeasibleSlot,
  reducedEstimate,
  reducedPriority,
} from "@/lib/rollover";
import type { TaskArea, TaskPriority, TaskStatus } from "@/lib/tasks";

export type ActionResult = { ok: true } | { ok: false; error: string };

function todayUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

export type CreateTaskInput = {
  title: string;
  area: TaskArea;
  /** Set when adding from a due-date-bucketed list (e.g. Today's "Due today") so the new task actually appears there — omitted on the plain task boards, which show every task regardless of due date. */
  due_date?: string | null;
  /** Only meaningful for school-area tasks — which class this is for. */
  course_id?: string | null;
};

export type CreateTaskResult = ActionResult & { id?: string };

/** Direct task creation — deliberately bypasses Inbox. A "+ Add task" button already knows it's a task; Inbox is for the ambiguous "sort this out later" capture case. */
export async function createTask(
  input: CreateTaskInput,
): Promise<CreateTaskResult> {
  const title = input.title.trim();
  if (!title) {
    return { ok: false, error: "Title can't be empty." };
  }

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) {
    return { ok: false, error: "Not signed in." };
  }

  const { data, error } = await supabase
    .from("tasks")
    .insert({
      user_id: user.id,
      title,
      area: input.area,
      due_date: input.due_date ?? null,
      course_id: input.course_id ?? null,
      source: "manual",
    })
    .select("id")
    .single();

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/tasks");
  revalidatePath("/");
  revalidatePath("/school");
  return { ok: true, id: data.id };
}

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

  if (status === "completed") {
    const { data: userData } = await supabase.auth.getUser();
    if (userData.user) {
      await logXpEvent(supabase, userData.user.id, "finish_block", todayUtc());
    }
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

export async function rescheduleTaskToNextSlot(
  taskId: string,
): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: existing, error: fetchError } = await supabase
    .from("tasks")
    .select("due_date, rollover_count")
    .eq("id", taskId)
    .single();

  if (fetchError || !existing?.due_date) {
    return { ok: false, error: fetchError?.message ?? "Task not found." };
  }

  const { error } = await supabase
    .from("tasks")
    .update({
      due_date: nextFeasibleSlot(existing.due_date),
      rollover_count: existing.rollover_count + 1,
    })
    .eq("id", taskId);

  if (error) {
    return { ok: false, error: error.message };
  }

  const { data: userData } = await supabase.auth.getUser();
  if (userData.user) {
    await logXpEvent(supabase, userData.user.id, "review_overdue", todayUtc());
  }

  revalidatePath("/tasks");
  revalidatePath("/");
  return { ok: true };
}

export async function reduceTaskScope(taskId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: existing, error: fetchError } = await supabase
    .from("tasks")
    .select("priority, estimated_minutes")
    .eq("id", taskId)
    .single();

  if (fetchError || !existing) {
    return { ok: false, error: fetchError?.message ?? "Task not found." };
  }

  const { error } = await supabase
    .from("tasks")
    .update({
      priority: reducedPriority(existing.priority as TaskPriority),
      estimated_minutes: reducedEstimate(existing.estimated_minutes),
    })
    .eq("id", taskId);

  if (error) {
    return { ok: false, error: error.message };
  }

  const { data: userData } = await supabase.auth.getUser();
  if (userData.user) {
    await logXpEvent(supabase, userData.user.id, "review_overdue", todayUtc());
  }

  revalidatePath("/tasks");
  revalidatePath("/");
  return { ok: true };
}

export async function deleteTask(taskId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("tasks").delete().eq("id", taskId);

  if (error) {
    return { ok: false, error: error.message };
  }

  const { data: userData } = await supabase.auth.getUser();
  if (userData.user) {
    await logXpEvent(supabase, userData.user.id, "review_overdue", todayUtc());
  }

  revalidatePath("/tasks");
  revalidatePath("/");
  return { ok: true };
}
