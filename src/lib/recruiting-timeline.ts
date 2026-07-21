import type { ApplicationStage } from "@/lib/recruiting";

const TERMINAL_STAGES = new Set<ApplicationStage>([
  "discovered",
  "rejected",
  "withdrawn",
  "archived",
]);

/** How far ahead a deadline/follow-up has to be to still count as "upcoming" — matches the old ClosingSoon window. Overdue items show regardless of how far past. */
export const TIMELINE_WINDOW_DAYS = 21;

export type TimelineApplication = {
  id: string;
  stage: ApplicationStage;
  next_action: string | null;
  next_action_date: string | null;
  opportunity: {
    title: string;
    company: { name: string } | null;
    url: string | null;
    deadline: string | null;
    active: boolean;
  } | null;
};

export type TimelineEntry = {
  applicationId: string;
  kind: "deadline" | "follow_up";
  date: string;
  title: string;
  companyName: string | null;
  url: string | null;
  label: string;
  urgency: "overdue" | "today" | "upcoming";
};

function classifyUrgency(dateStr: string, todayStr: string): "overdue" | "today" | "upcoming" {
  const date = dateStr.slice(0, 10);
  if (date < todayStr) return "overdue";
  if (date === todayStr) return "today";
  return "upcoming";
}

/**
 * Merges opportunity deadlines and application next-actions into one
 * date-sorted timeline — replaces the old separate ClosingSoon/
 * FollowUpsDue text lists (Phase 9D-4), since both were really the same
 * "what's coming up" question asked twice. Overdue items always show, no
 * matter how overdue; future items only within `TIMELINE_WINDOW_DAYS`.
 */
export function computeDeadlineTimeline(
  applications: TimelineApplication[],
  now: Date = new Date(),
): TimelineEntry[] {
  const today = now.toISOString().slice(0, 10);
  const cutoff = new Date(now.getTime() + TIMELINE_WINDOW_DAYS * 86_400_000)
    .toISOString()
    .slice(0, 10);

  const entries: TimelineEntry[] = [];
  for (const application of applications) {
    if (TERMINAL_STAGES.has(application.stage)) continue;
    const opportunity = application.opportunity;

    if (opportunity?.deadline && opportunity.active) {
      const date = opportunity.deadline.slice(0, 10);
      if (date <= cutoff) {
        entries.push({
          applicationId: application.id,
          kind: "deadline",
          date: opportunity.deadline,
          title: opportunity.title,
          companyName: opportunity.company?.name ?? null,
          url: opportunity.url,
          label: "Application deadline",
          urgency: classifyUrgency(opportunity.deadline, today),
        });
      }
    }

    if (application.next_action_date) {
      const date = application.next_action_date.slice(0, 10);
      if (date <= cutoff) {
        entries.push({
          applicationId: application.id,
          kind: "follow_up",
          date: application.next_action_date,
          title: opportunity?.title ?? "Untitled",
          companyName: opportunity?.company?.name ?? null,
          url: opportunity?.url ?? null,
          label: application.next_action ?? "Follow up",
          urgency: classifyUrgency(application.next_action_date, today),
        });
      }
    }
  }

  return entries.sort((a, b) => a.date.localeCompare(b.date));
}
