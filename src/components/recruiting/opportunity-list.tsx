import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ScoreEditForm } from "./score-edit-form";
import {
  APPLICATION_STAGE_LABELS,
  ROLE_FAMILY_LABELS,
  type ApplicationStage,
  type RoleFamily,
} from "@/lib/recruiting";

export type JobScoreRow = {
  role_family_score: number;
  skills_experience_score: number;
  eligibility_score: number;
  interest_industry_score: number;
  established_company_score: number;
  deadline_urgency_score: number;
  user_feedback_score: number;
  total_score: number;
  excluded: boolean;
  exclusion_reason: string | null;
  explanation: string;
};

export type ApplicationWithOpportunity = {
  id: string;
  stage: ApplicationStage;
  next_action: string | null;
  next_action_date: string | null;
  created_at: string;
  opportunity: {
    id: string;
    title: string;
    location: string | null;
    url: string | null;
    role_family: RoleFamily;
    deadline: string | null;
    active: boolean;
    company: { id: string; name: string; established: boolean } | null;
    job_scores: JobScoreRow | JobScoreRow[] | null;
  } | null;
};

function firstScore(scores: JobScoreRow | JobScoreRow[] | null | undefined): JobScoreRow | null {
  if (!scores) return null;
  return Array.isArray(scores) ? (scores[0] ?? null) : scores;
}

export function OpportunityList({
  applications,
}: {
  applications: ApplicationWithOpportunity[];
}) {
  if (applications.length === 0) {
    return (
      <Card>
        <CardContent className="text-muted-foreground py-10 text-center text-sm">
          No opportunities saved yet. Paste a job posting URL or add one
          manually to start tracking it.
        </CardContent>
      </Card>
    );
  }

  const sorted = [...applications].sort((a, b) => {
    const scoreA = firstScore(a.opportunity?.job_scores ?? null)?.total_score ?? 0;
    const scoreB = firstScore(b.opportunity?.job_scores ?? null)?.total_score ?? 0;
    const excludedA = firstScore(a.opportunity?.job_scores ?? null)?.excluded ?? false;
    const excludedB = firstScore(b.opportunity?.job_scores ?? null)?.excluded ?? false;
    if (excludedA !== excludedB) return excludedA ? 1 : -1;
    return scoreB - scoreA;
  });

  return (
    <div className="flex flex-col gap-3">
      {sorted.map((application) => {
        const opportunity = application.opportunity;
        if (!opportunity) return null;
        const score = firstScore(opportunity.job_scores);

        return (
          <Card key={application.id}>
            <CardContent className="flex flex-col gap-2 py-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium">
                    {opportunity.title}
                    <span className="text-muted-foreground font-normal">
                      {" "}
                      @ {opportunity.company?.name ?? "Unknown company"}
                    </span>
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {ROLE_FAMILY_LABELS[opportunity.role_family]}
                    {opportunity.location ? ` · ${opportunity.location}` : ""}
                    {opportunity.deadline
                      ? ` · due ${new Date(opportunity.deadline).toLocaleDateString()}`
                      : ""}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Badge variant="secondary">
                    {APPLICATION_STAGE_LABELS[application.stage]}
                  </Badge>
                  {score && (
                    <Badge variant={score.excluded ? "destructive" : "outline"}>
                      {score.excluded
                        ? score.exclusion_reason
                        : `${score.total_score}/100`}
                    </Badge>
                  )}
                </div>
              </div>
              {score && !score.excluded && (
                <p className="text-muted-foreground text-xs">{score.explanation}</p>
              )}
              <div className="flex items-center gap-3">
                {score && (
                  <ScoreEditForm opportunityId={opportunity.id} score={score} />
                )}
                {opportunity.url && (
                  <Link
                    href={opportunity.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary text-xs underline underline-offset-2"
                  >
                    View posting
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
