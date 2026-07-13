"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  confirmAssessmentCandidate,
  dismissAssessmentCandidate,
} from "@/app/(app)/school/assessment-actions";
import { ASSESSMENT_KIND_LABELS, type AssessmentKind } from "@/lib/assessments";

export type AssessmentCandidateRow = {
  id: string;
  title: string;
  kind: AssessmentKind;
  scheduled_at: string | null;
  confidence: number | null;
  source: string;
  courseTitle: string;
};

export function AssessmentReviewQueue({ candidates }: { candidates: AssessmentCandidateRow[] }) {
  const [isPending, startTransition] = useTransition();

  if (candidates.length === 0) return null;

  function confirm(id: string) {
    startTransition(async () => {
      const result = await confirmAssessmentCandidate(id);
      if (!result.ok) toast.error(result.error);
      else toast.success("Added to Upcoming Assessments.");
    });
  }

  function dismiss(id: string) {
    startTransition(async () => {
      const result = await dismissAssessmentCandidate(id);
      if (!result.ok) toast.error(result.error);
      else toast.success("Dismissed.");
    });
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-3 py-4">
        <h2 className="text-sm font-semibold">
          Assessment candidates
          <span className="text-muted-foreground font-normal">
            {" "}
            — confirm what {candidates[0]?.source === "canvas" ? "Canvas" : "GYST"} flagged as a real exam/deliverable
          </span>
        </h2>
        <ul className="flex flex-col gap-2">
          {candidates.map((candidate) => (
            <li
              key={candidate.id}
              className="flex items-center justify-between gap-3 text-sm"
            >
              <div className="flex flex-col">
                <span>
                  {candidate.title}{" "}
                  <span className="text-muted-foreground">— {candidate.courseTitle}</span>
                </span>
                <span className="text-muted-foreground text-xs">
                  {ASSESSMENT_KIND_LABELS[candidate.kind]}
                  {candidate.scheduled_at
                    ? ` · due ${new Date(candidate.scheduled_at).toLocaleDateString()}`
                    : ""}
                  {candidate.confidence != null ? ` · ${Math.round(candidate.confidence * 100)}% confident` : ""}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{ASSESSMENT_KIND_LABELS[candidate.kind]}</Badge>
                <Button size="sm" variant="outline" disabled={isPending} onClick={() => dismiss(candidate.id)}>
                  Dismiss
                </Button>
                <Button size="sm" disabled={isPending} onClick={() => confirm(candidate.id)}>
                  Confirm
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
