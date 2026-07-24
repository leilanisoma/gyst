import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { AmbientObjectPopup } from "@/components/room/ambient-object-popup";
import { JournalPopupBody } from "@/components/room/journal-popup-body";
import { PlannerPopup } from "@/components/room/planner-popup";
import { RoomBackground } from "@/components/room/room-background";
import { AMBIENT_OBJECTS } from "@/lib/rooms";
import { CaptureForm } from "@/components/capture/capture-form";
import { InboxList } from "@/app/(app)/inbox/inbox-list";
import { GmailContent } from "@/app/(app)/gmail/gmail-content";
import { SettingsContent } from "@/app/(app)/settings/settings-content";
import { isAIExtractionEnabled } from "@/ai";
import { CheckInCard } from "@/components/today/check-in-card";
import { FixedTimeline } from "@/components/today/fixed-timeline";
import { OverwhelmMode } from "@/components/today/overwhelm-mode";
import { RolloverReviewList } from "@/components/today/rollover-review-list";
import { TaskSummaryList } from "@/components/today/task-summary-list";
import { AddTaskForm } from "@/components/tasks/add-task-form";
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
import { getGreetingPhrase } from "@/lib/greeting";
import { bucketTodayTasks, bucketWeekTasks } from "@/lib/today";
import { buildDailyTimeline } from "@/lib/timeline";
import { cn } from "@/lib/utils";
import type { CheckIn } from "@/lib/check-ins";
import type { DailyPlan } from "@/lib/daily-plans";
import type { Task } from "@/lib/tasks";
import type { TimeBlockSuggestion } from "@/lib/time-block-suggestions";

const WEEK_DAYS = 7;

/** "ishani.s.sood" -> "Ishani" — just the first segment, capitalized. */
function firstNameFromEmail(email: string | undefined): string {
  const local = email?.split("@")[0] ?? "";
  const first = local.split(/[._+-]/)[0] || "there";
  return first.charAt(0).toUpperCase() + first.slice(1);
}

export default async function TodayPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const { view: rawView } = await searchParams;
  const view = rawView === "week" ? "week" : "today";

  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const firstName = firstNameFromEmail(data.user?.email);

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

  const { data: inboxItems } = await supabase
    .from("inbox_items")
    .select("id, raw_text, created_at")
    .eq("status", "inbox")
    .order("created_at", { ascending: false });
  const aiExtractionEnabled = isAIExtractionEnabled();

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
    <main className="relative isolate h-screen overflow-hidden p-4">
      <RoomBackground room="living-room" />

      <div className="absolute top-20 left-4 z-10 flex items-center gap-3">
        <PlannerPopup
          name={firstName}
          fallbackGreeting={getGreetingPhrase(now)}
        >
          <section className="flex flex-col gap-2">
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
            <div className="flex flex-col gap-5">
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
        </PlannerPopup>
        <XpGrowthVisual
          xp={totalXp(xpEvents ?? [])}
          daysEngaged={daysEngagedThisWeek(xpEvents ?? [], todayString)}
        />
      </div>

      {/* Living Room scene (Phase 9D, 2026-07-20): the mailbox/journal/
          thermostat float directly on the art as big chrome-less images —
          capture now lives on /inbox (behind the journal), and
          Wellness/School/Recruiting are reached by sliding
          (`RoomSlideArrows`), not a doorway grid here. The companion sits
          on the couch (`CompanionChatLauncher`, pathname-aware). Coordinates
          below are a first pass, picked by eye against the Living Room
          art's open wall/floor space — expect to nudge after seeing it
          live. */}
      <AmbientObjectPopup
        id="settings"
        label={AMBIENT_OBJECTS.settings.label}
        title="Settings"
        image={AMBIENT_OBJECTS.settings.image}
        accent={AMBIENT_OBJECTS.settings.accent}
        className="absolute top-[10%] left-[6%] w-28"
      >
        <SettingsContent />
      </AmbientObjectPopup>
      <AmbientObjectPopup
        id="journal"
        label="Journal"
        title="Journal"
        image={AMBIENT_OBJECTS.inbox.image}
        accent={AMBIENT_OBJECTS.inbox.accent}
        className="absolute top-[74%] left-[42%] w-32"
      >
        <JournalPopupBody
          quickContent={
            <>
              <CaptureForm />
              <TopOutcomesCard
                plan={(dailyPlan as DailyPlan | null) ?? null}
                dateString={todayString}
              />
              <CheckInCard
                checkIn={(checkIn as CheckIn | null) ?? null}
                dateString={todayString}
              />
            </>
          }
          fullInboxContent={
            <InboxList
              items={inboxItems ?? []}
              aiExtractionEnabled={aiExtractionEnabled}
            />
          }
        />
      </AmbientObjectPopup>
      <AmbientObjectPopup
        id="gmail"
        label={AMBIENT_OBJECTS.gmail.label}
        title="Gmail"
        image={AMBIENT_OBJECTS.gmail.image}
        accent={AMBIENT_OBJECTS.gmail.accent}
        className="absolute top-[48%] right-[6%] w-28"
      >
        <GmailContent />
      </AmbientObjectPopup>
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
        <AddTaskForm area="general" defaultDueDate={now.toISOString()} />
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
