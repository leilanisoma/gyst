import type { RoleFamily } from "@/lib/recruiting";

export type ScoreBreakdown = {
  roleFamily: number;
  skillsExperience: number;
  eligibility: number;
  interestIndustry: number;
  establishedCompany: number;
  deadlineUrgency: number;
  userFeedback: number;
  total: number;
  excluded: boolean;
  exclusionReason: string | null;
  explanation: string;
};

export type ScoreOpportunityInput = {
  roleFamily: RoleFamily;
  isSwe: boolean;
  isFinance: boolean;
  active: boolean;
  eligibleGradYears: number[];
  targetGradYear: number;
  established: boolean;
  deadline: string | null;
  /** True when `AIClient.classifyEducationFit` found the posting requires a degree level (e.g. PhD) the resume doesn't show — a hard exclusion, same tier as pure-SWE/pure-finance. */
  requiresUnmetEducation?: boolean;
  /** The classifier's reasoning, surfaced as the exclusion reason instead of a generic string when available. */
  educationMismatchReason?: string | null;
  /** Manual overrides for the dimensions PLAN.md §9 expects a person to correct, not compute. */
  skillsExperienceOverride?: number;
  interestIndustryOverride?: number;
  userFeedbackOverride?: number;
};

/**
 * Deterministic v1 scoring per PLAN.md §9 (100 points total). Skills/experience,
 * interest/industry fit, and user feedback have no reliable signal without AI or
 * explicit self-rating, so they seed at a neutral default and stay user-editable —
 * "Show the score breakdown and let Ishani correct it."
 */
export function scoreOpportunity(
  input: ScoreOpportunityInput,
  now: Date = new Date(),
): ScoreBreakdown {
  let exclusionReason: string | null = null;
  if (!input.active) {
    exclusionReason = "Closed role";
  } else if (input.isSwe) {
    exclusionReason = "Pure software engineering role";
  } else if (input.isFinance) {
    exclusionReason = "Pure finance role";
  } else if (input.requiresUnmetEducation) {
    exclusionReason = input.educationMismatchReason ?? "Requires a degree beyond your resume";
  } else if (
    input.eligibleGradYears.length > 0 &&
    !input.eligibleGradYears.includes(input.targetGradYear)
  ) {
    exclusionReason = "Ineligible graduation year";
  }
  const excluded = exclusionReason !== null;

  const roleFamily = input.roleFamily === "other" ? 5 : 25;

  const skillsExperience = clamp(input.skillsExperienceOverride ?? 10, 0, 20);

  let eligibility: number;
  if (excluded && exclusionReason === "Ineligible graduation year") {
    eligibility = 0;
  } else if (input.eligibleGradYears.length === 0) {
    eligibility = 12;
  } else if (input.eligibleGradYears.includes(input.targetGradYear)) {
    eligibility = 20;
  } else {
    eligibility = 0;
  }

  const interestIndustry = clamp(input.interestIndustryOverride ?? 5, 0, 10);
  const establishedCompany = input.established ? 10 : 0;
  const deadlineUrgency = deadlineUrgencyScore(input.deadline, now);
  const userFeedback = clamp(input.userFeedbackOverride ?? 3, 0, 5);

  const total = excluded
    ? 0
    : roleFamily +
      skillsExperience +
      eligibility +
      interestIndustry +
      establishedCompany +
      deadlineUrgency +
      userFeedback;

  const explanation = excluded
    ? `Excluded: ${exclusionReason}.`
    : buildExplanation({
        roleFamily,
        skillsExperience,
        eligibility,
        interestIndustry,
        establishedCompany,
        deadlineUrgency,
        userFeedback,
      });

  return {
    roleFamily,
    skillsExperience,
    eligibility,
    interestIndustry,
    establishedCompany,
    deadlineUrgency,
    userFeedback,
    total,
    excluded,
    exclusionReason,
    explanation,
  };
}

/** Shared `job_scores` insert shape so every caller that computes a breakdown persists it the same way. */
export function buildJobScoreRow(opportunityId: string, breakdown: ScoreBreakdown) {
  return {
    opportunity_id: opportunityId,
    role_family_score: breakdown.roleFamily,
    skills_experience_score: breakdown.skillsExperience,
    eligibility_score: breakdown.eligibility,
    interest_industry_score: breakdown.interestIndustry,
    established_company_score: breakdown.establishedCompany,
    deadline_urgency_score: breakdown.deadlineUrgency,
    user_feedback_score: breakdown.userFeedback,
    total_score: breakdown.total,
    excluded: breakdown.excluded,
    exclusion_reason: breakdown.exclusionReason ?? null,
    explanation: breakdown.explanation,
  };
}

function deadlineUrgencyScore(deadline: string | null, now: Date): number {
  if (!deadline) return 1;
  const days = (new Date(deadline).getTime() - now.getTime()) / 86_400_000;
  if (days < 0) return 1;
  if (days <= 7) return 10;
  if (days <= 14) return 8;
  if (days <= 30) return 5;
  if (days <= 60) return 3;
  return 1;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function buildExplanation(parts: {
  roleFamily: number;
  skillsExperience: number;
  eligibility: number;
  interestIndustry: number;
  establishedCompany: number;
  deadlineUrgency: number;
  userFeedback: number;
}): string {
  return [
    `Role family ${parts.roleFamily}/25`,
    `Skills/experience ${parts.skillsExperience}/20`,
    `Eligibility ${parts.eligibility}/20`,
    `Interest/industry ${parts.interestIndustry}/10`,
    `Established company ${parts.establishedCompany}/10`,
    `Deadline urgency ${parts.deadlineUrgency}/10`,
    `User feedback ${parts.userFeedback}/5`,
  ].join(", ");
}
