import { createClient } from "@/lib/supabase/server";
import { TaskBoard } from "@/components/tasks/task-board";
import type { Task } from "@/lib/tasks";

export default async function TasksPage() {
  const supabase = await createClient();
  const { data: taskRows } = await supabase
    .from("tasks")
    .select(
      "id, title, notes, area, status, priority, estimated_minutes, due_date, rollover_count, course_id, course:courses(title), work_estimates(predicted_minutes, actual_minutes)",
    )
    .order("created_at", { ascending: true });

  const tasks: Task[] = (taskRows ?? []).map((row) => {
    const estimate = row.work_estimates[0] ?? null;
    return {
      ...row,
      course_title: (row.course as { title: string } | null)?.title ?? null,
      predicted_minutes: estimate?.predicted_minutes ?? null,
      actual_minutes: estimate?.actual_minutes ?? null,
    };
  }) as Task[];

  return (
    <main className="flex flex-1 flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Tasks</h1>
        <p className="text-muted-foreground text-sm">
          Drag a card to change its status, or use the card menu on mobile and
          keyboard.
        </p>
      </div>
      <TaskBoard tasks={tasks} />
    </main>
  );
}
