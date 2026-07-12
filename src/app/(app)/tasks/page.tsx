import { createClient } from "@/lib/supabase/server";
import { TaskBoard } from "@/components/tasks/task-board";
import type { Task } from "@/lib/tasks";

export default async function TasksPage() {
  const supabase = await createClient();
  const { data: tasks } = await supabase
    .from("tasks")
    .select(
      "id, title, notes, area, status, priority, estimated_minutes, due_date, rollover_count",
    )
    .order("created_at", { ascending: true });

  return (
    <main className="flex flex-1 flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Tasks</h1>
        <p className="text-muted-foreground text-sm">
          Drag a card to change its status, or use the card menu on mobile and
          keyboard.
        </p>
      </div>
      <TaskBoard tasks={(tasks ?? []) as Task[]} />
    </main>
  );
}
