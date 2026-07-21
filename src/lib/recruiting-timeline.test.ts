import { describe, expect, it } from "vitest";
import { computeDeadlineTimeline, type TimelineApplication } from "./recruiting-timeline";

const now = new Date("2026-07-21T12:00:00Z");

function daysFromNow(days: number): string {
  return new Date(now.getTime() + days * 86_400_000).toISOString();
}

function makeApplication(
  overrides: Omit<Partial<TimelineApplication>, "opportunity"> & {
    opportunity?: Partial<NonNullable<TimelineApplication["opportunity"]>>;
  } = {},
): TimelineApplication {
  return {
    id: overrides.id ?? "app-1",
    stage: overrides.stage ?? "applied",
    next_action: overrides.next_action ?? null,
    next_action_date: overrides.next_action_date ?? null,
    opportunity: {
      title: "Test Role",
      company: { name: "Acme" },
      url: "https://example.com",
      deadline: null,
      active: true,
      ...overrides.opportunity,
    },
  };
}

describe("computeDeadlineTimeline", () => {
  it("includes a deadline within the window, sorted soonest-first alongside a follow-up", () => {
    const entries = computeDeadlineTimeline([
      makeApplication({ id: "a", opportunity: { title: "Later Role", deadline: daysFromNow(10) } }),
      makeApplication({ id: "b", next_action: "Send thank-you", next_action_date: daysFromNow(3) }),
    ], now);

    expect(entries.map((e) => e.applicationId)).toEqual(["b", "a"]);
    expect(entries[0]).toMatchObject({ kind: "follow_up", label: "Send thank-you", urgency: "upcoming" });
    expect(entries[1]).toMatchObject({ kind: "deadline", urgency: "upcoming" });
  });

  it("excludes discovered/rejected/withdrawn/archived and inactive opportunities", () => {
    const entries = computeDeadlineTimeline([
      makeApplication({ stage: "archived", opportunity: { deadline: daysFromNow(3) } }),
      makeApplication({ stage: "rejected", opportunity: { deadline: daysFromNow(3) } }),
      makeApplication({ stage: "discovered", opportunity: { deadline: daysFromNow(3) } }),
      makeApplication({ stage: "applied", opportunity: { deadline: daysFromNow(3), active: false } }),
    ], now);
    expect(entries).toEqual([]);
  });

  it("excludes a deadline beyond the window but keeps an overdue follow-up regardless of how overdue", () => {
    const entries = computeDeadlineTimeline([
      makeApplication({ id: "far", opportunity: { deadline: daysFromNow(60) } }),
      makeApplication({ id: "stale", next_action: "Follow up", next_action_date: daysFromNow(-200) }),
    ], now);
    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({ applicationId: "stale", urgency: "overdue" });
  });

  it("marks today's date as 'today', not 'overdue' or 'upcoming'", () => {
    const entries = computeDeadlineTimeline([
      makeApplication({ next_action: "Call recruiter", next_action_date: now.toISOString() }),
    ], now);
    expect(entries[0].urgency).toBe("today");
  });

  it("emits both a deadline and a follow-up entry for the same application", () => {
    const entries = computeDeadlineTimeline([
      makeApplication({
        id: "a",
        next_action: "Prep for interview",
        next_action_date: daysFromNow(2),
        opportunity: { deadline: daysFromNow(5) },
      }),
    ], now);
    expect(entries).toHaveLength(2);
    expect(entries.map((e) => e.kind).sort()).toEqual(["deadline", "follow_up"]);
  });
});
