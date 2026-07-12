export type RoleFamily =
  | "product_management"
  | "product_ops_business_ops"
  | "strategy_consulting"
  | "growth_business_development"
  | "data_analytics_insights"
  | "ai_adjacent_non_swe"
  | "venture_startup_ecosystem"
  | "other";

export const ROLE_FAMILIES: RoleFamily[] = [
  "product_management",
  "product_ops_business_ops",
  "strategy_consulting",
  "growth_business_development",
  "data_analytics_insights",
  "ai_adjacent_non_swe",
  "venture_startup_ecosystem",
  "other",
];

export const ROLE_FAMILY_LABELS: Record<RoleFamily, string> = {
  product_management: "Product management",
  product_ops_business_ops: "Product / business operations",
  strategy_consulting: "Strategy & consulting",
  growth_business_development: "Growth / business development",
  data_analytics_insights: "Data analytics & insights",
  ai_adjacent_non_swe: "AI-adjacent (non-SWE)",
  venture_startup_ecosystem: "Venture / startup ecosystem",
  other: "Other",
};

export type ApplicationStage =
  | "discovered"
  | "saved"
  | "preparing"
  | "ready"
  | "applied"
  | "assessment"
  | "recruiter_screen"
  | "interview"
  | "final_round"
  | "offer"
  | "rejected"
  | "withdrawn"
  | "archived";

export const APPLICATION_STAGES: ApplicationStage[] = [
  "discovered",
  "saved",
  "preparing",
  "ready",
  "applied",
  "assessment",
  "recruiter_screen",
  "interview",
  "final_round",
  "offer",
  "rejected",
  "withdrawn",
  "archived",
];

/** Stages shown as Kanban columns — archived/withdrawn stay list-only to keep the board legible. */
export const APPLICATION_BOARD_STAGES: ApplicationStage[] = [
  "saved",
  "preparing",
  "ready",
  "applied",
  "assessment",
  "recruiter_screen",
  "interview",
  "final_round",
  "offer",
  "rejected",
];

export const APPLICATION_STAGE_LABELS: Record<ApplicationStage, string> = {
  discovered: "Discovered",
  saved: "Saved",
  preparing: "Preparing",
  ready: "Ready",
  applied: "Applied",
  assessment: "Assessment",
  recruiter_screen: "Recruiter screen",
  interview: "Interview",
  final_round: "Final round",
  offer: "Offer",
  rejected: "Rejected",
  withdrawn: "Withdrawn",
  archived: "Archived",
};

export type CompanySizeCategory =
  | "startup"
  | "smb"
  | "midsize"
  | "large"
  | "enterprise";

export const COMPANY_SIZE_CATEGORIES: CompanySizeCategory[] = [
  "startup",
  "smb",
  "midsize",
  "large",
  "enterprise",
];

export type ContactRelationship =
  | "alum"
  | "referral"
  | "recruiter"
  | "mentor"
  | "colleague"
  | "friend"
  | "other";

export const CONTACT_RELATIONSHIPS: ContactRelationship[] = [
  "alum",
  "referral",
  "recruiter",
  "mentor",
  "colleague",
  "friend",
  "other",
];

export type InteractionKind =
  | "meeting"
  | "call"
  | "email"
  | "message"
  | "coffee_chat"
  | "event"
  | "other";

export const INTERACTION_KINDS: InteractionKind[] = [
  "meeting",
  "call",
  "email",
  "message",
  "coffee_chat",
  "event",
  "other",
];

export type DocumentKind =
  | "resume"
  | "transcript"
  | "cover_letter"
  | "writing_sample"
  | "job_description"
  | "other";

export const DOCUMENT_KINDS: DocumentKind[] = [
  "resume",
  "transcript",
  "cover_letter",
  "writing_sample",
  "job_description",
  "other",
];

export const DOCUMENT_KIND_LABELS: Record<DocumentKind, string> = {
  resume: "Resume",
  transcript: "Transcript",
  cover_letter: "Cover letter",
  writing_sample: "Writing sample",
  job_description: "Job description",
  other: "Other",
};

export type DraftKind = "cover_letter" | "recruiter_message" | "application_response";

export const DRAFT_KINDS: DraftKind[] = [
  "cover_letter",
  "recruiter_message",
  "application_response",
];

export const DRAFT_KIND_LABELS: Record<DraftKind, string> = {
  cover_letter: "Cover letter",
  recruiter_message: "Recruiter message",
  application_response: "Application response",
};

/** Builds a per-user dedup key so re-pasting the same posting never creates a duplicate opportunity. */
export function opportunityFingerprint(input: {
  companyName: string;
  title: string;
  url: string | null;
}): string {
  const normalize = (value: string) =>
    value.trim().toLowerCase().replace(/\s+/g, " ");
  if (input.url?.trim()) {
    return `url:${normalize(input.url)}`;
  }
  return `manual:${normalize(input.companyName)}:${normalize(input.title)}`;
}
