import { createClient } from "@/lib/supabase/server";
import { RoomHeader } from "@/components/room/room-header";
import { ROOMS } from "@/lib/rooms";
import { getLocalDateString } from "@/lib/date-range";
import { weeklyTrendObservations, type WellnessCheckIn } from "@/lib/wellness";
import { WellnessCheckInForm } from "@/components/wellness/wellness-check-in-form";
import { WellnessHistory } from "@/components/wellness/wellness-history";
import { WellnessDataControls } from "@/components/wellness/wellness-data-controls";
import { CycleImportCard } from "@/components/wellness/cycle-import-card";
import { HealthSummaryForm } from "@/components/wellness/health-summary-form";
import { listCycleObservations } from "@/lib/health/cycle-observations";
import { listDailySummaries } from "@/lib/health/daily-summaries";

const HISTORY_LIMIT = 30;

export default async function WellnessPage() {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;

  const { data: profile } = await supabase
    .from("profiles")
    .select("timezone")
    .eq("id", user?.id ?? "")
    .maybeSingle();
  const todayString = getLocalDateString(new Date(), profile?.timezone ?? "UTC");

  const { data: rows } = await supabase
    .from("wellness_check_ins")
    .select(
      "id, check_in_date, energy, mood, stress, sleep_perception, ate_consistently, recovery, note",
    )
    .order("check_in_date", { ascending: false })
    .limit(HISTORY_LIMIT);

  const checkIns = (rows ?? []) as WellnessCheckIn[];
  const todayCheckIn = checkIns.find((c) => c.check_in_date === todayString) ?? null;
  const observations = weeklyTrendObservations(checkIns, todayString);
  const cycleObservations = user ? await listCycleObservations(supabase, user.id) : [];
  const healthSummaries = user ? await listDailySummaries(supabase, user.id) : [];

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 p-6">
      <RoomHeader {...ROOMS.wellness} />
      <p className="text-muted-foreground max-w-lg text-sm">
        Lightweight, optional check-ins for supportive awareness — not a
        tracker to optimize. Every field is skippable.
      </p>

      <section className="border-border bg-muted/40 text-muted-foreground rounded-lg border p-3 text-xs">
        This is not medical advice. If a period stops or something feels
        concerning, please talk with a qualified clinician — GYST only
        reflects back what you tell it, in plain language, with no diagnosis
        or causal claims. This data is private: it&rsquo;s kept out of chat
        and general AI context unless you attach it to a question yourself.
      </section>

      <section className="border-border bg-card flex flex-col gap-3 rounded-lg border p-4">
        <h2 className="text-sm font-semibold">Today&rsquo;s check-in</h2>
        <WellnessCheckInForm checkIn={todayCheckIn} dateString={todayString} />
      </section>

      <section className="border-border bg-card flex flex-col gap-2 rounded-lg border p-4">
        <h2 className="text-sm font-semibold">This week, in plain terms</h2>
        <p className="text-muted-foreground text-xs">
          Visible only to you. Describes what you logged — never a diagnosis
          or a reason why.
        </p>
        {observations.length > 0 ? (
          <ul className="flex flex-col gap-1 text-sm">
            {observations.map((observation) => (
              <li key={observation}>{observation}</li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground text-sm">
            No repeated pattern to show yet this week — check back after a
            few more check-ins.
          </p>
        )}
      </section>

      <section className="border-border bg-card flex flex-col gap-3 rounded-lg border p-4">
        <h2 className="text-sm font-semibold">History</h2>
        <WellnessHistory checkIns={checkIns} />
      </section>

      <section className="border-border bg-card flex flex-col gap-3 rounded-lg border p-4">
        <h2 className="text-sm font-semibold">Health metrics (optional, manual)</h2>
        <HealthSummaryForm dateString={todayString} summaries={healthSummaries} />
      </section>

      <section className="border-border bg-card flex flex-col gap-3 rounded-lg border p-4">
        <h2 className="text-sm font-semibold">Cycle tracking (optional)</h2>
        <CycleImportCard observations={cycleObservations} />
      </section>

      <section className="border-border bg-card flex flex-col gap-3 rounded-lg border p-4">
        <h2 className="text-sm font-semibold">Your data</h2>
        <p className="text-muted-foreground text-xs">
          Export everything you&rsquo;ve logged, or delete it all at once.
        </p>
        <WellnessDataControls />
      </section>
    </main>
  );
}
