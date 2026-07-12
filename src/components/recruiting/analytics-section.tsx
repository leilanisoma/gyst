import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  computeApplicationsPerWeek,
  computeMedianResponseDays,
  computeRoleFamilyConversion,
  computeSourceCoverage,
  computeSourceEffectiveness,
  computeStageFunnel,
  type AnalyticsApplication,
  type AnalyticsEvent,
} from "@/lib/recruiting-analytics";
import {
  ROLE_FAMILY_LABELS,
  type ApplicationStage,
  type RoleFamily,
} from "@/lib/recruiting";

export async function AnalyticsSection() {
  const supabase = await createClient();

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

  const funnel = computeStageFunnel(analyticsEvents);
  const weekly = computeApplicationsPerWeek(analyticsApps, 8);
  const medianResponseDays = computeMedianResponseDays(analyticsEvents);
  const bySource = computeSourceEffectiveness(analyticsApps);
  const byRoleFamily = computeRoleFamilyConversion(analyticsApps);
  const sourceCoverage = computeSourceCoverage(analyticsApps);

  return (
    <Card>
      <CardContent className="flex flex-col gap-4 py-4">
        <h2 className="text-sm font-semibold">Funnel analytics</h2>

        <div>
          <p className="text-muted-foreground text-xs">Applications per week</p>
          <div className="mt-1 flex items-end gap-1">
            {weekly.map((week) => (
              <div key={week.weekStart} className="flex flex-col items-center gap-1">
                <div
                  className="bg-primary w-4 rounded-t"
                  style={{ height: `${Math.max(4, week.count * 12)}px` }}
                  title={`${week.weekStart}: ${week.count}`}
                />
                <span className="text-muted-foreground text-[10px]">{week.count}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <p className="text-muted-foreground text-xs">Stage funnel (ever reached)</p>
          <div className="mt-1 flex flex-col gap-1">
            {funnel.map((step) => (
              <div key={step.stage} className="flex items-center gap-2 text-xs">
                <span className="w-32 shrink-0">{step.label}</span>
                <div className="bg-muted h-2 flex-1 rounded">
                  <div
                    className="bg-primary h-2 rounded"
                    style={{
                      width: `${
                        funnel[0].reached > 0
                          ? (step.reached / funnel[0].reached) * 100
                          : 0
                      }%`,
                    }}
                  />
                </div>
                <span className="w-6 text-right">{step.reached}</span>
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

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-muted-foreground text-xs">Source effectiveness</p>
            <ul className="mt-1 flex flex-col gap-1 text-xs">
              {bySource.map((group) => (
                <li key={group.key}>
                  {group.key}: {group.total} saved, {group.appliedOrBeyond} applied+,{" "}
                  {group.offers} offers
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Role-family conversion</p>
            <ul className="mt-1 flex flex-col gap-1 text-xs">
              {byRoleFamily.map((group) => (
                <li key={group.key}>
                  {ROLE_FAMILY_LABELS[group.key as RoleFamily] ?? group.key}:{" "}
                  {group.total} saved, {group.appliedOrBeyond} applied+, {group.offers}{" "}
                  offers
                </li>
              ))}
            </ul>
          </div>
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
