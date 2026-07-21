import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DeadlineTimeline } from "./deadline-timeline";
import type { TimelineApplication } from "@/lib/recruiting-timeline";

function daysFromNow(days: number): string {
  return new Date(Date.now() + days * 86_400_000).toISOString();
}

describe("DeadlineTimeline", () => {
  it("renders nothing when there's nothing upcoming", () => {
    const { container } = render(<DeadlineTimeline applications={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders a deadline entry with its company and an overdue follow-up", () => {
    const applications: TimelineApplication[] = [
      {
        id: "a",
        stage: "applied",
        next_action: null,
        next_action_date: null,
        opportunity: {
          title: "Product Intern",
          company: { name: "Acme" },
          url: "https://example.com",
          deadline: daysFromNow(5),
          active: true,
        },
      },
      {
        id: "b",
        stage: "interview",
        next_action: "Send thank-you note",
        next_action_date: daysFromNow(-3),
        opportunity: { title: "Growth Intern", company: null, url: null, deadline: null, active: true },
      },
    ];

    render(<DeadlineTimeline applications={applications} />);

    expect(screen.getByText("Product Intern")).toBeInTheDocument();
    expect(screen.getByText("Acme", { exact: false })).toBeInTheDocument();
    expect(screen.getByText("Send thank-you note", { exact: false })).toBeInTheDocument();
    expect(screen.getByText("overdue")).toBeInTheDocument();
  });
});
