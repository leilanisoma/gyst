import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ClosingSoon } from "./closing-soon";
import type { ApplicationWithOpportunity } from "./types";

function daysFromNow(days: number): string {
  return new Date(Date.now() + days * 86_400_000).toISOString();
}

type OpportunityShape = NonNullable<ApplicationWithOpportunity["opportunity"]>;

function makeApplication(overrides: {
  id?: string;
  stage?: ApplicationWithOpportunity["stage"];
  opportunity?: Partial<OpportunityShape>;
}): ApplicationWithOpportunity {
  return {
    id: overrides.id ?? "app-1",
    stage: overrides.stage ?? "applied",
    notes: null,
    prep_notes: null,
    next_action: null,
    next_action_date: null,
    created_at: new Date().toISOString(),
    drafts: [],
    opportunity: {
      id: "opp-1",
      title: "Test Role",
      location: null,
      url: null,
      role_family: "other",
      deadline: null,
      active: true,
      source: "manual",
      feedback: null,
      company: { id: "c1", name: "Acme", established: false },
      job_scores: null,
      ...overrides.opportunity,
    },
  };
}

describe("ClosingSoon", () => {
  it("renders nothing when nothing is closing soon", () => {
    const { container } = render(
      <ClosingSoon
        applications={[makeApplication({ opportunity: { deadline: daysFromNow(30) } })]}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("shows an active application with a deadline inside the window, sorted soonest-first", () => {
    render(
      <ClosingSoon
        applications={[
          makeApplication({ id: "a", opportunity: { title: "Later Role", deadline: daysFromNow(10) } }),
          makeApplication({ id: "b", opportunity: { title: "Sooner Role", deadline: daysFromNow(3) } }),
        ]}
      />,
    );

    const items = screen.getAllByText(/Role/);
    expect(items[0]).toHaveTextContent("Sooner Role");
    expect(items[1]).toHaveTextContent("Later Role");
  });

  it("excludes archived/rejected/withdrawn/discovered stages and inactive opportunities", () => {
    const { container } = render(
      <ClosingSoon
        applications={[
          makeApplication({ stage: "archived", opportunity: { deadline: daysFromNow(3) } }),
          makeApplication({ stage: "rejected", opportunity: { deadline: daysFromNow(3) } }),
          makeApplication({ stage: "discovered", opportunity: { deadline: daysFromNow(3) } }),
          makeApplication({ stage: "applied", opportunity: { deadline: daysFromNow(3), active: false } }),
        ]}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("excludes a deadline that already passed", () => {
    const { container } = render(
      <ClosingSoon applications={[makeApplication({ opportunity: { deadline: daysFromNow(-1) } })]} />,
    );
    expect(container).toBeEmptyDOMElement();
  });
});
