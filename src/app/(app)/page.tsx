import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { CaptureForm } from "@/components/capture/capture-form";
import { CheckInCard } from "@/components/today/check-in-card";
import { OverwhelmMode } from "@/components/today/overwhelm-mode";
import { RolloverReviewList } from "@/components/today/rollover-review-list";
import { TaskSummaryList } from "@/components/today/task-summary-list";
import { TimeBlockSuggestions } from "@/components/today/time-block-suggestions";
import { TopOutcomesCard } from "@/components/today/top-outcomes-card";
import { WeeklyGoalsList } from "@/components/today/weekly-goals-list";
import { buttonVariants } from "@/components/ui/button";
import { getLocalDateString } from "@/lib/date-range";
import { bucketTodayTasks, bucketWeekTasks } from "@/lib/today";
import { cn } from "@/lib/utils";
import type { CheckIn } from "@/lib/check-ins";
import type { DailyPlan } from "@/lib/daily-plans";
import type { Task } from "@/lib/tasks";
import type { TimeBlockSuggestion } from "@/lib/time-block-suggestions";

const WEEK_DAYS = 7;

export default async function TodayPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const { view: rawView } = await searchParams;
  const view = rawView === "week" ? "week" : "today";

  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const firstName = data.user?.email?.split("@")[0] ?? "there";

  const { data: profile } = await supabase
    .from("profiles")
    .select("timezone")
    .eq("id", data.user?.id ?? "")
    .maybeSingle();
  const timeZone = profile?.timezone ?? "UTC";

  const { data: tasks } = await supabase
    .from("tasks")
    .select(
      "id, title, notes, area, status, priority, estimated_minutes, due_date, rollover_count",
    )
    .order("due_date", { ascending: true });

  const now = new Date();
  const todayString = getLocalDateString(now, timeZone);

  const { data: checkIn } = await supabase
    .from("check_ins")
    .select(
      "id, check_in_date, mood, energy, stress, sleep_perception, capacity_minutes, note",
    )
    .eq("check_in_date", todayString)
    .maybeSingle();

  const { data: suggestions } = await supabase
    .from("time_block_suggestions")
    .select(
      "id, task_id, start_at, end_at, status, explanation, score, tasks(title, area)",
    )
    .eq("suggestion_date", todayString)
    .neq("status", "dismissed")
    .order("start_at", { ascending: true });

  const { data: dailyPlan } = await supabase
    .from("daily_plans")
    .select("id, plan_date, outcome_1, outcome_2, outcome_3")
    .eq("plan_date", todayString)
    .maybeSingle();

  const { data: weeklyGoals } = await supabase
    .from("goals")
    .select("id, title, target_date")
    .eq("horizon", "weekly")
    .eq("status", "active")
    .order("target_date", { ascending: true });

  return (
    <main className="flex flex-1 flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Hi, {firstName}.
        </h1>
        <p className="text-muted-foreground max-w-sm text-sm">
          The fixed timeline, proposed time blocks, and top-three outcomes land
          here later in Phase 2. For now, see what&rsquo;s overdue or coming up,
          or capture a thought below.
        </p>
      </div>

      <div className="flex items-center justify-between gap-2">
        <div className="flex gap-2">
          <Link
            href="/"
            className={cn(
              buttonVariants({
                variant: view === "today" ? "default" : "outline",
                size: "sm",
              }),
            )}
          >
            Today
          </Link>
          <Link
            href="/?view=week"
            className={cn(
              buttonVariants({
                variant: view === "week" ? "default" : "outline",
                size: "sm",
              }),
            )}
          >
            This Week
          </Link>
        </div>
        <OverwhelmMode tasks={(tasks ?? []) as Task[]} now={now} />
      </div>

      {view === "today" ? (
        <div className="flex max-w-xl flex-col gap-5">
          <TopOutcomesCard
            plan={(dailyPlan as DailyPlan | null) ?? null}
            dateString={todayString}
          />
          <CheckInCard
            checkIn={(checkIn as CheckIn | null) ?? null}
            dateString={todayString}
          />
          <TimeBlockSuggestions
            suggestions={(suggestions ?? []) as TimeBlockSuggestion[]}
          />
          <TodayView
            tasks={(tasks ?? []) as Task[]}
            now={now}
            timeZone={timeZone}
          />
          <WeeklyGoalsList goals={weeklyGoals ?? []} />
        </div>
      ) : (
        <WeekView
          tasks={(tasks ?? []) as Task[]}
          now={now}
          timeZone={timeZone}
        />
      )}

      <div className="max-w-xl">
        <CaptureForm />
      </div>
    </main>
  );
}

function TodayView({
  tasks,
  now,
  timeZone,
}: {
  tasks: Task[];
  now: Date;
  timeZone: string;
}) {
  const { overdue, dueToday } = bucketTodayTasks(tasks, now, timeZone);

  return (
    <>
      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold">Overdue</h2>
        <RolloverReviewList tasks={overdue} />
      </section>
      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold">Due today</h2>
        <TaskSummaryList tasks={dueToday} emptyMessage="Nothing due today." />
      </section>
    </>
  );
}

function WeekView({
  tasks,
  now,
  timeZone,
}: {
  tasks: Task[];
  now: Date;
  timeZone: string;
}) {
  const days = bucketWeekTasks(tasks, now, timeZone, WEEK_DAYS);

  return (
    <div className="flex max-w-xl flex-col gap-5">
      {days.map((day) => (
        <section key={day.start.toISOString()} className="flex flex-col gap-2">
          <h2 className="text-sm font-semibold">
            {day.start.toLocaleDateString(undefined, {
              weekday: "long",
              month: "short",
              day: "numeric",
              timeZone,
            })}
          </h2>
          <TaskSummaryList
            tasks={day.tasks}
            emptyMessage="Nothing due this day."
          />
        </section>
      ))}
    </div>
  );
}
