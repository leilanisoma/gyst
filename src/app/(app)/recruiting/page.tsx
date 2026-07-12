import { createClient } from "@/lib/supabase/server";
import { OpportunityForm } from "@/components/recruiting/opportunity-form";
import {
  OpportunityList,
  type ApplicationWithOpportunity,
} from "@/components/recruiting/opportunity-list";

const APPLICATIONS_SELECT = `
  id, stage, next_action, next_action_date, created_at,
  opportunity:opportunities(
    id, title, location, url, role_family, deadline, active,
    company:companies(id, name, established),
    job_scores(
      role_family_score, skills_experience_score, eligibility_score,
      interest_industry_score, established_company_score,
      deadline_urgency_score, user_feedback_score,
      total_score, excluded, exclusion_reason, explanation
    )
  )
`;

export default async function RecruitingPage() {
  const supabase = await createClient();

  const { data: applications } = await supabase
    .from("applications")
    .select(APPLICATIONS_SELECT)
    .order("created_at", { ascending: false });

  return (
    <main className="flex flex-1 flex-col gap-6 p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Recruiting</h1>
          <p className="text-muted-foreground text-sm">
            Every saved opportunity becomes a tracked application — no
            separate spreadsheet.
          </p>
        </div>
        <OpportunityForm />
      </div>
      <OpportunityList
        applications={(applications ?? []) as ApplicationWithOpportunity[]}
      />
    </main>
  );
}
