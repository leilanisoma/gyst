/**
 * Prompt for the recruiting fit score's education-mismatch check (PLAN.md
 * §9 skills/experience dimension, `src/lib/job-scoring.ts`). Kept as a
 * versioned file per CLAUDE.md's "prompts are versioned files under
 * src/ai/prompts/, not inline strings" rule.
 */
export function buildEducationFitPrompt(
  resumeText: string,
  jobTitle: string,
  jobDescription: string | null,
): string {
  return (
    `Compare this internship posting's stated education requirement against ` +
    `the candidate's resume below. Set requiresUnmetEducation to true only ` +
    `if the posting explicitly requires a degree level the resume does not ` +
    `show the candidate has completed or is actively pursuing — most ` +
    `commonly a PhD/doctoral degree, or a completed Master's, required for ` +
    `a research-scientist-style role. A "preferred" (not required) advanced ` +
    `degree, or an ordinary internship with no stated degree requirement, ` +
    `must be false. Never base this on GPA, school prestige, major, or ` +
    `anything other than the posting's explicitly stated requirement.\n\n` +
    `Resume:\n${resumeText}\n\n` +
    `Posting title: ${jobTitle}\n` +
    `Posting description: ${jobDescription ?? "(none provided)"}`
  );
}
