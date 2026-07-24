import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { GroupEffectivenessChart } from "@/components/recruiting/group-effectiveness-chart";
import { WeeklyGoalMeter } from "@/components/recruiting/weekly-goal-meter";
import {
  computeApplicationsPerWeek,
  computeMedianResponseDays,
  computeRoleFamilyConversion,
  computeSourceCoverage,
  computeSourceEffectiveness,
  computeStageFunnel,
  computeWeeklyGoalProgress,
  isGhosted,
  type AnalyticsApplication,
  type AnalyticsEvent,
} from "@/lib/recruiting-analytics";
import { getWeeklyApplicationGoal } from "@/lib/recruiting-preferences";
import {
  ROLE_FAMILY_LABELS,
  type ApplicationStage,
  type RoleFamily,
} from "@/lib/recruiting";

const SOURCE_LABELS: Record<string, string> = {
  greenhouse: "Greenhouse",
  lever: "Lever",
  curated_feed: "Curated feed",
  manual: "Manual",
};

export async function AnalyticsSection() {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;

  const { data: applications } = await supabase
    .from("applications")
    .select(
      "id, stage, created_at, opportunity:opportunities(source, role_family, job_scores(excluded))",
    );

  const { data: applicationIds } = await supabase.from("applications").select("id");
  const ids = (applicationIds ?? []).map((a) => a.id);

  const { data: events } =
    ids.length > 0
      ? await supabase
          .from("application_events")
          .select("application_id, to_stage, occurred_at")
          .in("application_id", ids)
      : { data: [] };

  const analyticsApps: AnalyticsApplication[] = (applications ?? []).map((app) => {
    const jobScores = app.opportunity?.job_scores;
    const score = Array.isArray(jobScores) ? jobScores[0] : jobScores;
    return {
      id: app.id,
      stage: app.stage as ApplicationStage,
      created_at: app.created_at,
      source: app.opportunity?.source ?? "manual",
      role_family: (app.opportunity?.role_family ?? "other") as RoleFamily,
      excluded: score?.excluded ?? false,
    };
  });
  const analyticsEvents: AnalyticsEvent[] = events ?? [];

  if (analyticsApps.length === 0) return null;

  const weeklyGoal = user ? await getWeeklyApplicationGoal(supabase, user.id) : 5;
  const goalProgress = computeWeeklyGoalProgress(analyticsEvents, weeklyGoal);
  const ghostedCount = (applications ?? []).filter((app) =>
    isGhosted({ id: app.id, stage: app.stage as ApplicationStage }, analyticsEvents),
  ).length;

  const funnel = computeStageFunnel(analyticsApps);
  const weekly = computeApplicationsPerWeek(analyticsEvents, 8);
  const medianResponseDays = computeMedianResponseDays(analyticsEvents);
  const bySource = computeSourceEffectiveness(analyticsApps);
  const byRoleFamily = computeRoleFamilyConversion(analyticsApps);
  const sourceCoverage = computeSourceCoverage(analyticsApps);
  const maxWeekly = Math.max(1, ...weekly.map((w) => w.count));
  const maxFunnel = Math.max(1, ...funnel.map((f) => f.count));

  return (
    <Card>
      <CardContent className="flex flex-col gap-5 py-4">
        <h2 className="text-sm font-semibold">Dashboard</h2>

        <WeeklyGoalMeter progress={goalProgress} />

        {ghostedCount > 0 && (
          <Badge variant="destructive" className="w-fit">
            {ghostedCount} application{ghostedCount === 1 ? "" : "s"} gone quiet — no reply
            in 60+ days
          </Badge>
        )}

        <div>
          <p className="text-muted-foreground text-xs">Applications per week</p>
          <div className="mt-1 flex items-end gap-1.5">
            {weekly.map((week) => (
              <div
                key={week.weekStart}
                className="flex flex-1 flex-col items-center gap-1"
              >
                <span className="text-muted-foreground text-[10px] tabular-nums">
                  {week.count}
                </span>
                <div
                  className="bg-primary w-full rounded-t-sm"
                  style={{ height: `${Math.max(4, (week.count / maxWeekly) * 48)}px` }}
                  title={`${week.weekStart}: ${week.count}`}
                />
              </div>
            ))}
          </div>
        </div>

        <div>
          <p className="text-muted-foreground text-xs">Stage funnel (current stage)</p>
          <div className="mt-1 flex flex-col gap-1">
            {funnel.map((step, i) => (
              <div key={step.stage} className="flex items-center gap-2 text-xs">
                <span className="w-32 shrink-0">{step.label}</span>
                <div className="bg-muted h-2 flex-1 rounded-full">
                  <div
                    className="bg-primary h-2 rounded-full"
                    style={{
                      width: `${(step.count / maxFunnel) * 100}%`,
                      opacity: 0.5 + (0.5 * (i + 1)) / funnel.length,
                    }}
                  />
                </div>
                <span className="w-6 text-right tabular-nums">{step.count}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs">
          Median time from applied to next stage:{" "}
          {medianResponseDays !== null
            ? `${medianResponseDays.toFixed(1)} days`
            : "not enough data yet"}
        </p>

        <div className="flex flex-col gap-4">
          <GroupEffectivenessChart
            title="Source effectiveness"
            groups={bySource}
            labelFor={(key) => SOURCE_LABELS[key] ?? key}
          />
          <GroupEffectivenessChart
            title="Role-family conversion"
            groups={byRoleFamily}
            labelFor={(key) => ROLE_FAMILY_LABELS[key as RoleFamily] ?? key}
          />
        </div>

        <div>
          <p className="text-muted-foreground text-xs">
            Source coverage
            <span className="font-normal"> — target: at least 80% plausibly relevant per source</span>
          </p>
          <ul className="mt-1 flex flex-col gap-1 text-xs">
            {sourceCoverage.map((coverage) => (
              <li key={coverage.key} className="flex items-center gap-2">
                <span>
                  {coverage.key}: {coverage.total} surfaced, {coverage.excluded} excluded
                </span>
                <Badge variant={coverage.relevanceRate >= 0.8 ? "outline" : "destructive"}>
                  {Math.round(coverage.relevanceRate * 100)}% relevant
                </Badge>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
