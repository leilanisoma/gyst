import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { CaptureForm } from "@/components/capture/capture-form";
import { AmbientObject } from "@/components/room/ambient-object";
import { RoomDoorway } from "@/components/room/room-doorway";
import { AMBIENT_OBJECTS, ROOMS } from "@/lib/rooms";
import { CheckInCard } from "@/components/today/check-in-card";
import { FixedTimeline } from "@/components/today/fixed-timeline";
import { OverwhelmMode } from "@/components/today/overwhelm-mode";
import { RolloverReviewList } from "@/components/today/rollover-review-list";
import { TaskSummaryList } from "@/components/today/task-summary-list";
import { TimeBlockSuggestions } from "@/components/today/time-block-suggestions";
import { TopOutcomesCard } from "@/components/today/top-outcomes-card";
import { WeeklyGoalsList } from "@/components/today/weekly-goals-list";
import { XpGrowthVisual } from "@/components/today/xp-growth-visual";
import { buttonVariants } from "@/components/ui/button";
import {
  getLocalDateString,
  getLocalDayOfWeek,
  getLocalDayRange,
} from "@/lib/date-range";
import { daysEngagedThisWeek, totalXp } from "@/lib/gamification";
import { bucketTodayTasks, bucketWeekTasks } from "@/lib/today";
import { buildDailyTimeline } from "@/lib/timeline";
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
      "id, task_id, start_at, end_at, status, explanation, score, google_event_id, tasks(title, area)",
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

  const { data: xpEvents } = await supabase
    .from("xp_events")
    .select("points, occurred_on")
    .order("occurred_on", { ascending: false })
    .limit(500);

  const todayRange = getLocalDayRange(now, timeZone);
  const { data: todayEvents } = await supabase
    .from("events")
    .select("id, title, start_at, end_at, all_day, location, course_id")
    .is("deleted_at", null)
    .lt("start_at", todayRange.end.toISOString())
    .gt("end_at", todayRange.start.toISOString())
    .order("start_at", { ascending: true });

  const { data: todaySchedules } = await supabase
    .from("recurring_schedules")
    .select("id, title, category, start_time, end_time, location")
    .eq("day_of_week", getLocalDayOfWeek(now, timeZone))
    .eq("active", true);

  const timeline = buildDailyTimeline(
    todayEvents ?? [],
    todaySchedules ?? [],
    now,
    timeZone,
  );

  return (
    <main className="flex flex-1 flex-col gap-6 p-6">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">
          Hi, {firstName}.
        </h1>
        <XpGrowthVisual
          xp={totalXp(xpEvents ?? [])}
          daysEngaged={daysEngagedThisWeek(xpEvents ?? [], todayString)}
        />
      </div>

      {/* The four full rooms (Phase 9D room map) — doorways replacing the
          sidebar as primary navigation. Placeholder accents/layout; each
          gets its own themed dressing in 9D-2..9D-5. */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {Object.values(ROOMS).map((room) => {
          const Icon = room.icon;
          return (
            <RoomDoorway
              key={room.id}
              {...room}
              icon={<Icon className="size-6 text-white" aria-hidden="true" />}
            />
          );
        })}
      </div>

      {/* Living-room layout (Phase 9C/9D): the capture nook and the
          journal/thermostat ambient objects sit in their own zone
          alongside the main task/planning area, instead of everything
          stacking in one column. The companion itself now lives in the
          global chat launcher (AppShell), not a card here. */}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <aside className="order-first flex w-full flex-col gap-4 lg:order-last lg:w-72 lg:shrink-0">
          <div className="bg-card ring-foreground/10 shadow-cozy rounded-xl p-4 ring-1">
            <CaptureForm />
          </div>
          <div className="flex gap-2">
            {Object.entries(AMBIENT_OBJECTS).map(([key, object]) => {
              const Icon = object.icon;
              return (
                <AmbientObject
                  key={key}
                  href={object.href}
                  label={object.label}
                  accent={object.accent}
                  className="flex-1"
                  icon={
                    <Icon className="size-4 text-white" aria-hidden="true" />
                  }
                />
              );
            })}
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col gap-6">
          <section className="flex max-w-xl flex-col gap-2">
            <h2 className="text-sm font-semibold">Today&rsquo;s timeline</h2>
            <FixedTimeline items={timeline} timeZone={timeZone} />
          </section>

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
        </div>
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
