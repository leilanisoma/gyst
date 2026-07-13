import type { createClient } from "@/lib/supabase/server";
import type { AssessmentKind } from "@/lib/assessments";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

// Ordinary code, not a prompt, per CLAUDE.md — deterministic checkpoints
// spaced backward from a due date. Offsets past the due date (assignment
// due in 2 days) are dropped, not clamped, since "start" 14 days before
// something due in 2 days is nonsensical, not just late.
const MILESTONE_OFFSETS: { label: string; daysBefore: number }[] = [
  { label: "Start", daysBefore: 14 },
  { label: "Outline / first draft", daysBefore: 7 },
  { label: "Revise", daysBefore: 3 },
  { label: "Final review", daysBefore: 1 },
];

const MILESTONE_WORTHY_ASSESSMENT_KINDS: AssessmentKind[] = ["final", "midterm", "project", "presentation"];
const MILESTONE_POINTS_THRESHOLD = 50;

/** PLAN.md §15 task 6.7 — only "major" assignments/assessments get milestones, not every quiz or problem set. */
export function isMilestoneWorthy(input: {
  pointsPossible?: number | null;
  assessmentKind?: AssessmentKind | null;
}): boolean {
  if (input.assessmentKind && MILESTONE_WORTHY_ASSESSMENT_KINDS.includes(input.assessmentKind)) {
    return true;
  }
  return (input.pointsPossible ?? 0) >= MILESTONE_POINTS_THRESHOLD;
}

export function generateMilestoneDates(
  dueAt: Date,
  now: Date,
): { label: string; dueDate: Date }[] {
  return MILESTONE_OFFSETS.map(({ label, daysBefore }) => ({
    label,
    dueDate: new Date(dueAt.getTime() - daysBefore * 86_400_000),
  })).filter((milestone) => milestone.dueDate.getTime() > now.getTime());
}

export type CreateMilestonesInput = {
  title: string;
  dueAt: string;
  pointsPossible?: number | null;
  assessmentKind?: AssessmentKind | null;
  assignmentId?: string;
  assessmentId?: string;
};

/**
 * Creates proposed milestone checkpoints for one assignment or assessment,
 * unless it's already been suggested before (re-syncing an assignment or
 * re-confirming an assessment must not pile up duplicate suggestions) or
 * isn't "major" enough, or every offset has already passed. Returns the
 * number of suggestions created.
 */
export async function createMilestoneSuggestions(
  supabase: SupabaseServerClient,
  userId: string,
  input: CreateMilestonesInput,
  now: Date,
): Promise<number> {
  if (!isMilestoneWorthy(input)) return 0;
  if (!input.assignmentId && !input.assessmentId) {
    throw new Error("createMilestoneSuggestions requires an assignmentId or assessmentId.");
  }

  let existingQuery = supabase.from("milestone_suggestions").select("id").eq("user_id", userId);
  existingQuery = input.assignmentId
    ? existingQuery.eq("assignment_id", input.assignmentId)
    : existingQuery.eq("assessment_id", input.assessmentId!);
  const { data: existing } = await existingQuery;
  if (existing && existing.length > 0) return 0;

  const dates = generateMilestoneDates(new Date(input.dueAt), now);
  if (dates.length === 0) return 0;

  const { error } = await supabase.from("milestone_suggestions").insert(
    dates.map((d) => ({
      user_id: userId,
      assignment_id: input.assignmentId ?? null,
      assessment_id: input.assessmentId ?? null,
      title: `${d.label}: ${input.title}`,
      due_date: d.dueDate.toISOString(),
      status: "proposed",
    })),
  );
  if (error) {
    throw new Error(`Failed to create milestone suggestions: ${error.message}`);
  }
  return dates.length;
}
