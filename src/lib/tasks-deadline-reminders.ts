import type { SupabaseServiceClient } from "@/lib/supabase/service";
import { createNotification } from "@/lib/notifications";

const AREA_LINKS: Record<string, string> = {
  recruiting: "/recruiting",
  school: "/school",
  wellness: "/wellness",
  general: "/tasks",
};

export type RunDeadlineRemindersResult = {
  ok: true;
  notified: number;
};

/**
 * Notifies once per task whose due_date falls within the next 24h and hasn't
 * been notified yet (`deadline_notified_at is null`) — covers recruiting
 * next-actions and school assessments too, since both flow into `tasks`
 * (PLAN.md §7), not just ad hoc to-dos. `deadline_notified_at` is the dedup
 * guard so re-running this job (or running it more than once a day) never
 * double-sends.
 */
export async function runDeadlineReminders(
  supabase: SupabaseServiceClient,
  userId: string,
): Promise<RunDeadlineRemindersResult> {
  const now = new Date();
  const windowEnd = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const { data: tasks, error } = await supabase
    .from("tasks")
    .select("id, title, area, due_date")
    .eq("user_id", userId)
    .in("status", ["not_started", "in_progress"])
    .is("deadline_notified_at", null)
    .not("due_date", "is", null)
    .lte("due_date", windowEnd.toISOString())
    .gte("due_date", now.toISOString());

  if (error) {
    throw new Error(`Failed to load upcoming tasks: ${error.message}`);
  }

  let notified = 0;
  for (const task of tasks ?? []) {
    await createNotification(supabase, userId, {
      kind: "deadline",
      title: `Due soon: ${task.title}`,
      body: task.due_date
        ? `Due ${new Date(task.due_date).toLocaleString()}`
        : undefined,
      link: AREA_LINKS[task.area] ?? "/tasks",
    });
    await supabase
      .from("tasks")
      .update({ deadline_notified_at: new Date().toISOString() })
      .eq("id", task.id);
    notified++;
  }

  return { ok: true, notified };
}
