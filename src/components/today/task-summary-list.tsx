import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import type { Task } from "@/lib/tasks";

export function TaskSummaryList({
  tasks,
  emptyMessage,
}: {
  tasks: Task[];
  emptyMessage: string;
}) {
  if (tasks.length === 0) {
    return <p className="text-muted-foreground text-sm">{emptyMessage}</p>;
  }

  return (
    <ul className="flex flex-col gap-1.5">
      {tasks.map((task) => (
        <li key={task.id}>
          <Link
            href="/tasks"
            className="border-border bg-card hover:bg-muted flex items-center justify-between gap-2 rounded-lg border p-2.5 text-sm transition-colors"
          >
            <span className="min-w-0 truncate font-medium">{task.title}</span>
            <span className="flex shrink-0 items-center gap-1.5">
              <Badge variant="secondary">{task.area}</Badge>
              {task.due_date && (
                <span className="text-muted-foreground text-xs">
                  {new Date(task.due_date).toLocaleTimeString(undefined, {
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </span>
              )}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
