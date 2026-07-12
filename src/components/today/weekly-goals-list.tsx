import { Badge } from "@/components/ui/badge";

export type WeeklyGoal = {
  id: string;
  title: string;
  target_date: string | null;
};

export function WeeklyGoalsList({ goals }: { goals: WeeklyGoal[] }) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-sm font-semibold">This week&rsquo;s goals</h2>
      {goals.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          No weekly goals yet — add one from the inbox.
        </p>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {goals.map((goal) => (
            <li
              key={goal.id}
              className="border-border bg-card flex items-center justify-between gap-2 rounded-lg border p-2.5 text-sm"
            >
              <span className="min-w-0 truncate font-medium">{goal.title}</span>
              {goal.target_date && (
                <Badge variant="secondary">
                  {new Date(goal.target_date).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                  })}
                </Badge>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
