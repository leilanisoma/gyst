import { createClient } from "@/lib/supabase/server";
import { RoomHeader } from "@/components/room/room-header";
import { RoomBackground } from "@/components/room/room-background";
import { RoomContentPanel } from "@/components/room/room-content-panel";
import { CollapsibleSection } from "@/components/room/collapsible-section";
import { RoomSideTabs } from "@/components/room/room-side-tabs";
import { ROOMS } from "@/lib/rooms";
import { OpportunityForm } from "@/components/recruiting/opportunity-form";
import { ApplicationsView } from "@/components/recruiting/applications-view";
import { DeadlineTimeline } from "@/components/recruiting/deadline-timeline";
import { DocumentsSection } from "@/components/recruiting/documents-section";
import { ContactsSection } from "@/components/recruiting/contacts-section";
import { AnalyticsSection } from "@/components/recruiting/analytics-section";
import { SourcesSection } from "@/components/recruiting/sources-section";
import { DiscoveryQueue } from "@/components/recruiting/discovery-queue";
import { BookmarkletCard } from "@/components/recruiting/bookmarklet-card";
import { PipelineTabContent } from "@/components/recruiting/pipeline-tab-content";
import type { ApplicationWithOpportunity } from "@/components/recruiting/types";
import { isGhosted, type AnalyticsEvent } from "@/lib/recruiting-analytics";

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
  // (board/table/timeline) — mixing an automated firehose in with roles
  // the user already decided to pursue is exactly the clutter PLAN.md's
  // anxiety-aware UX principle warns against. They live in their own queue
  // (task 5.5) until promoted to "saved" or dismissed. Archived
  // applications (dismissed via "Not relevant" or the stage dropdown) are
  // done-for-good the same way — they shouldn't resurface in the pipeline
  // just because "archived" isn't "discovered".
  const pipelineApplications = applications.filter(
    (a) => a.stage !== "discovered" && a.stage !== "archived",
  );
  const discoveredApplications = applications.filter(
    (a) => a.stage === "discovered",
  );

  const { data: events } =
    pipelineApplications.length > 0
      ? await supabase
          .from("application_events")
          .select("application_id, to_stage, occurred_at")
          .in("application_id", pipelineApplications.map((a) => a.id))
      : { data: [] };
  const analyticsEvents: AnalyticsEvent[] = events ?? [];
  const ghostedIds = new Set(
    pipelineApplications
      .filter((a) => isGhosted(a, analyticsEvents))
      .map((a) => a.id),
  );

  return (
    <main className="relative isolate h-screen overflow-hidden">
      <RoomBackground room={ROOMS.recruiting.background} />

      <RoomContentPanel className="absolute inset-x-4 top-16 max-h-[40vh] md:inset-x-auto md:top-1/2 md:left-[3%] md:max-h-[80vh] md:w-[420px] md:-translate-y-1/2">
        <div className="flex flex-col gap-3">
          <div className="flex items-start justify-between gap-4">
            <RoomHeader {...ROOMS.recruiting} />
            <OpportunityForm />
          </div>
          <p className="text-muted-foreground text-sm">
            Every saved opportunity becomes a tracked application — no separate
            spreadsheet.
          </p>
        </div>
        <DeadlineTimeline applications={pipelineApplications} />
        <AnalyticsSection />
      </RoomContentPanel>

      {/* Desktop: a persistent tab rail that expands leftward, one tab open at a time, closes on click-away. */}
      <div className="absolute top-1/2 right-[3%] z-10 hidden -translate-y-1/2 md:flex">
        <RoomSideTabs
          tabs={[
            {
              id: "discovery",
              label: "Discovery queue",
              width: "w-[min(560px,88vw)]",
              content: <DiscoveryQueue applications={discoveredApplications} />,
            },
            {
              id: "pipeline",
              label: "Pipeline",
              width: "w-[min(820px,80vw)]",
              content: (
                <PipelineTabContent
                  applications={pipelineApplications}
                  ghostedIds={ghostedIds}
                />
              ),
            },
            { id: "documents", label: "Documents", content: <DocumentsSection /> },
            { id: "contacts", label: "Contacts", content: <ContactsSection /> },
            {
              id: "sources",
              label: "Sources & capture",
              content: (
                <>
                  <SourcesSection />
                  <BookmarkletCard />
                </>
              ),
            },
          ]}
        />
      </div>

      {/* Mobile fallback: the tab-rail's expand-left/click-away doesn't translate below md, so this stays the plain stacked-accordion layout. */}
      <RoomContentPanel className="absolute inset-x-4 bottom-4 max-h-[40vh] md:hidden">
        <h2 className="font-heading text-base font-semibold">More</h2>
        <CollapsibleSection title="Discovery queue">
          <DiscoveryQueue applications={discoveredApplications} />
        </CollapsibleSection>
        <CollapsibleSection title="Pipeline">
          <ApplicationsView applications={pipelineApplications} ghostedIds={ghostedIds} />
        </CollapsibleSection>
        <CollapsibleSection title="Documents">
          <DocumentsSection />
        </CollapsibleSection>
        <CollapsibleSection title="Contacts">
          <ContactsSection />
        </CollapsibleSection>
        <CollapsibleSection title="Sources & capture">
          <SourcesSection />
          <BookmarkletCard />
        </CollapsibleSection>
      </RoomContentPanel>
    </main>
  );
}
