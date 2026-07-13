"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateAssessmentPreparationStatus } from "@/app/(app)/school/assessment-actions";
import {
  ASSESSMENT_KIND_LABELS,
  ASSESSMENT_PREPARATION_STATUSES,
  ASSESSMENT_PREPARATION_STATUS_LABELS,
  type AssessmentKind,
  type AssessmentPreparationStatus,
} from "@/lib/assessments";

export type UpcomingAssessmentRow = {
  id: string;
  title: string;
  kind: AssessmentKind;
  scheduled_at: string | null;
  preparation_status: AssessmentPreparationStatus;
  courseTitle: string;
  term: string | null;
};

function countdownLabel(scheduledAt: string | null): string {
  if (!scheduledAt) return "No date set";
  const days = Math.ceil((new Date(scheduledAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
  if (days < 0) return "Past";
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  return `In ${days} days`;
}

function groupByTerm(rows: UpcomingAssessmentRow[]): { term: string; rows: UpcomingAssessmentRow[] }[] {
  const groups = new Map<string, UpcomingAssessmentRow[]>();
  for (const row of rows) {
    const key = row.term ?? "No term";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(row);
  }
  return [...groups.entries()].map(([term, groupRows]) => ({ term, rows: groupRows }));
}

function PreparationStatusSelect({
  assessmentId,
  status,
}: {
  assessmentId: string;
  status: AssessmentPreparationStatus;
}) {
  const [isPending, startTransition] = useTransition();

  function onChange(value: string) {
    startTransition(async () => {
      const result = await updateAssessmentPreparationStatus(
        assessmentId,
        value as AssessmentPreparationStatus,
      );
      if (!result.ok) toast.error(result.error);
    });
  }

  return (
    <Select value={status} onValueChange={(value) => value && onChange(value)}>
      <SelectTrigger disabled={isPending} className="h-7 w-[130px] text-xs">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {ASSESSMENT_PREPARATION_STATUSES.map((value) => (
          <SelectItem key={value} value={value}>
            {ASSESSMENT_PREPARATION_STATUS_LABELS[value]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/** PLAN.md §15 task 6.3 — countdowns, preparation status, and a term timeline for confirmed assessments. */
export function UpcomingAssessments({ assessments }: { assessments: UpcomingAssessmentRow[] }) {
  if (assessments.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col gap-2 py-4">
          <h2 className="text-sm font-semibold">Upcoming assessments</h2>
          <p className="text-muted-foreground text-sm">
            Nothing confirmed yet. Confirm a candidate above once Canvas flags one.
          </p>
        </CardContent>
      </Card>
    );
  }

  const groups = groupByTerm(assessments);

  return (
    <Card>
      <CardContent className="flex flex-col gap-4 py-4">
        <h2 className="text-sm font-semibold">Upcoming assessments</h2>
        {groups.map((group) => (
          <div key={group.term} className="flex flex-col gap-2">
            <h3 className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
              {group.term}
            </h3>
            <ul className="flex flex-col gap-2">
              {group.rows.map((row) => (
                <li key={row.id} className="flex items-center justify-between gap-3 text-sm">
                  <div className="flex flex-col">
                    <span>
                      {row.title} <span className="text-muted-foreground">— {row.courseTitle}</span>
                    </span>
                    <span className="text-muted-foreground text-xs">{countdownLabel(row.scheduled_at)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{ASSESSMENT_KIND_LABELS[row.kind]}</Badge>
                    <PreparationStatusSelect assessmentId={row.id} status={row.preparation_status} />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
