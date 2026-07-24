import { createClient } from "@/lib/supabase/server";
import { RoomHeader } from "@/components/room/room-header";
import { RoomBackground } from "@/components/room/room-background";
import { RoomContentPanel } from "@/components/room/room-content-panel";
import { GrowthPlant } from "@/components/room/growth-plant";
import { CollapsibleSection } from "@/components/room/collapsible-section";
import { RoomSideTabs } from "@/components/room/room-side-tabs";
import { ROOMS } from "@/lib/rooms";
import { getLocalDateString } from "@/lib/date-range";
import {
  checkInDaysThisWeek,
  weeklyTrendObservations,
  wellnessGrowthStage,
  type WellnessCheckIn,
} from "@/lib/wellness";
import { WellnessCheckInForm } from "@/components/wellness/wellness-check-in-form";
import { WellnessHistory } from "@/components/wellness/wellness-history";
import { WellnessDataControls } from "@/components/wellness/wellness-data-controls";
import { CycleImportCard } from "@/components/wellness/cycle-import-card";
import { CycleEntryForm } from "@/components/wellness/cycle-entry-form";
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
  const todayString = getLocalDateString(
    new Date(),
    profile?.timezone ?? "UTC",
  );

  const { data: rows } = await supabase
    .from("wellness_check_ins")
    .select(
      "id, check_in_date, energy, mood, stress, sleep_perception, ate_consistently, recovery, note",
    )
    .order("check_in_date", { ascending: false })
    .limit(HISTORY_LIMIT);

  const checkIns = (rows ?? []) as WellnessCheckIn[];
  const todayCheckIn =
    checkIns.find((c) => c.check_in_date === todayString) ?? null;
  const observations = weeklyTrendObservations(checkIns, todayString);
  const cycleObservations = user
    ? await listCycleObservations(supabase, user.id)
    : [];
  const healthSummaries = user
    ? await listDailySummaries(supabase, user.id)
    : [];

  const daysCheckedIn = checkInDaysThisWeek(checkIns, todayString);
  const growthStage = wellnessGrowthStage(daysCheckedIn);
  const growthBrightness = 0.75 + (daysCheckedIn / 7) * 0.4;

  return (
    <main className="relative isolate h-screen overflow-hidden">
      <RoomBackground room={ROOMS.wellness.background} />

      <div
        className="absolute top-[63%] left-[43%] z-10 hidden md:block"
        style={{ filter: "drop-shadow(0 3px 8px rgba(0,0,0,0.35))" }}
      >
        <GrowthPlant
          stage={growthStage}
          brightness={growthBrightness}
          ariaLabel={`Growing steadily — checked in ${daysCheckedIn} of the last 7 days`}
          title={`${daysCheckedIn}/7 days checked in this week`}
          size={3.2}
          pot
          leafColor="var(--chart-1)"
        />
      </div>

      <RoomContentPanel className="absolute inset-x-4 top-16 max-h-[40vh] md:inset-x-auto md:top-1/2 md:left-[4%] md:max-h-[75vh] md:w-[380px] md:-translate-y-1/2">
        <RoomHeader {...ROOMS.wellness} />
        <p className="text-muted-foreground text-sm">
          Lightweight, optional check-ins for supportive awareness. Every field is skippable.
        </p>

        <section className="border-border bg-card flex flex-col gap-3 rounded-lg border p-4">
          <h2 className="text-sm font-semibold">Today&rsquo;s check-in</h2>
          <WellnessCheckInForm
            checkIn={todayCheckIn}
            dateString={todayString}
          />
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
              No repeated pattern to show yet this week — check back after a few
              more check-ins.
            </p>
          )}
        </section>
      </RoomContentPanel>

      {/* Desktop: a persistent tab rail that expands leftward, one tab open at a time, closes on click-away. */}
      <div className="absolute top-1/2 right-[4%] z-10 hidden -translate-y-1/2 md:flex">
        <RoomSideTabs
          tabs={[
            {
              id: "history",
              label: "History",
              content: <WellnessHistory checkIns={checkIns} />,
            },
            {
              id: "health",
              label: "Health metrics",
              content: (
                <HealthSummaryForm
                  dateString={todayString}
                  summaries={healthSummaries}
                />
              ),
            },
            {
              id: "cycle",
              label: "Cycle tracking",
              content: (
                <>
                  <CycleEntryForm dateString={todayString} />
                  <div className="border-t pt-3">
                    <CycleImportCard observations={cycleObservations} />
                  </div>
                </>
              ),
            },
            {
              id: "data",
              label: "Your data",
              content: (
                <>
                  <p className="text-muted-foreground text-xs">
                    Export everything you&rsquo;ve logged, or delete it all at once.
                  </p>
                  <WellnessDataControls />
                </>
              ),
            },
          ]}
        />
      </div>

      {/* Mobile fallback: the tab-rail's expand-left/click-away doesn't translate below md, so this stays the plain stacked-accordion layout. */}
      <RoomContentPanel className="absolute inset-x-4 bottom-4 max-h-[38vh] md:hidden">
        <h2 className="font-heading text-base font-semibold">More</h2>
        <CollapsibleSection title="History">
          <WellnessHistory checkIns={checkIns} />
        </CollapsibleSection>
        <CollapsibleSection title="Health metrics (optional, manual)">
          <HealthSummaryForm
            dateString={todayString}
            summaries={healthSummaries}
          />
        </CollapsibleSection>
        <CollapsibleSection title="Cycle tracking (optional)">
          <CycleEntryForm dateString={todayString} />
          <div className="border-t pt-3">
            <CycleImportCard observations={cycleObservations} />
          </div>
        </CollapsibleSection>
        <CollapsibleSection title="Your data">
          <p className="text-muted-foreground text-xs">
            Export everything you&rsquo;ve logged, or delete it all at once.
          </p>
          <WellnessDataControls />
        </CollapsibleSection>
      </RoomContentPanel>
    </main>
  );
}
