import { createClient } from "@/lib/supabase/server";
import { OpportunityForm } from "@/components/recruiting/opportunity-form";
import { ApplicationsView } from "@/components/recruiting/applications-view";
import { FollowUpsDue } from "@/components/recruiting/follow-ups-due";
import { DocumentsSection } from "@/components/recruiting/documents-section";
import { ContactsSection } from "@/components/recruiting/contacts-section";
import { AnalyticsSection } from "@/components/recruiting/analytics-section";
import { SourcesSection } from "@/components/recruiting/sources-section";
import { DiscoveryQueue } from "@/components/recruiting/discovery-queue";
import { BookmarkletCard } from "@/components/recruiting/bookmarklet-card";
import type { ApplicationWithOpportunity } from "@/components/recruiting/types";

const APPLICATIONS_SELECT = `
  id, stage, notes, prep_notes, next_action, next_action_date, created_at,
  drafts(
    id, kind, content, resume_document_id, evidence_document_ids,
    unsupported_claims, status
  ),
  opportunity:opportunities(
    id, title, location, url, role_family, deadline, active, source, feedback,
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

  const { data: allApplications } = await supabase
    .from("applications")
    .select(APPLICATIONS_SELECT)
    .order("created_at", { ascending: false });

  const applications = (allApplications ?? []) as ApplicationWithOpportunity[];
  // Discovered-but-untriaged opportunities stay out of the main pipeline
  // (board/table/follow-ups) — mixing an automated firehose in with roles
  // the user already decided to pursue is exactly the clutter PLAN.md's
  // anxiety-aware UX principle warns against. They live in their own queue
  // (task 5.5) until promoted to "saved" or dismissed.
  const pipelineApplications = applications.filter((a) => a.stage !== "discovered");
  const discoveredApplications = applications.filter((a) => a.stage === "discovered");

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
      <SourcesSection />
      <BookmarkletCard />
      <DiscoveryQueue applications={discoveredApplications} />
      <FollowUpsDue applications={pipelineApplications} />
      <AnalyticsSection />
      <ApplicationsView applications={pipelineApplications} />
      <DocumentsSection />
      <ContactsSection />
    </main>
  );
}
