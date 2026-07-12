import type {
  ApplicationStage,
  ContactRelationship,
  DraftKind,
  InteractionKind,
  RoleFamily,
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

export type DraftRow = {
  id: string;
  kind: DraftKind;
  content: string;
  resume_document_id: string | null;
  evidence_document_ids: string[];
  unsupported_claims: string[];
  status: "draft" | "approved" | "exported";
};

export type ApplicationWithOpportunity = {
  id: string;
  stage: ApplicationStage;
  notes: string | null;
  prep_notes: string | null;
  next_action: string | null;
  next_action_date: string | null;
  created_at: string;
  drafts: DraftRow[];
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

export type InteractionRow = {
  id: string;
  kind: InteractionKind;
  summary: string;
  occurred_at: string;
  follow_up_at: string | null;
};

export type ContactWithInteractions = {
  id: string;
  name: string;
  role: string | null;
  relationship: ContactRelationship;
  email: string | null;
  linkedin_url: string | null;
  last_contacted_at: string | null;
  next_contact_at: string | null;
  company: { id: string; name: string } | null;
  interactions: InteractionRow[];
};

export function firstScore(
  scores: JobScoreRow | JobScoreRow[] | null | undefined,
): JobScoreRow | null {
  if (!scores) return null;
  return Array.isArray(scores) ? (scores[0] ?? null) : scores;
}

export function sortByScore(
  applications: ApplicationWithOpportunity[],
): ApplicationWithOpportunity[] {
  return [...applications].sort((a, b) => {
    const scoreA = firstScore(a.opportunity?.job_scores ?? null);
    const scoreB = firstScore(b.opportunity?.job_scores ?? null);
    const excludedA = scoreA?.excluded ?? false;
    const excludedB = scoreB?.excluded ?? false;
    if (excludedA !== excludedB) return excludedA ? 1 : -1;
    return (scoreB?.total_score ?? 0) - (scoreA?.total_score ?? 0);
  });
}
