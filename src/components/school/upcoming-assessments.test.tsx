import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { UpcomingAssessments, type UpcomingAssessmentRow } from "./upcoming-assessments";

function daysFromNow(days: number): string {
  return new Date(new Date().getTime() + days * 86_400_000).toISOString();
}

function row(overrides: Partial<UpcomingAssessmentRow>): UpcomingAssessmentRow {
  return {
    id: "a-1",
    title: "Midterm 1",
    kind: "midterm",
    scheduled_at: daysFromNow(5),
    preparation_status: "not_started",
    courseTitle: "CS 101",
    term: "Fall 2026",
    ...overrides,
  };
}

describe("UpcomingAssessments", () => {
  it("shows an empty state when nothing is confirmed", () => {
    render(<UpcomingAssessments assessments={[]} />);
    expect(screen.getByText(/Nothing confirmed yet/)).toBeInTheDocument();
  });

  it("renders a countdown and groups by term", () => {
    render(
      <UpcomingAssessments
        assessments={[
          row({ id: "a", title: "Midterm 1", term: "Fall 2026", scheduled_at: daysFromNow(5) }),
          row({ id: "b", title: "Final", term: "Fall 2026", scheduled_at: daysFromNow(40) }),
          row({ id: "c", title: "Quiz 1", term: "Spring 2027", scheduled_at: daysFromNow(90) }),
        ]}
      />,
    );

    expect(screen.getByText("Fall 2026")).toBeInTheDocument();
    expect(screen.getByText("Spring 2027")).toBeInTheDocument();
    expect(screen.getByText(/Midterm 1/)).toBeInTheDocument();
    expect(screen.getByText("In 5 days")).toBeInTheDocument();
  });

  it("labels today and past dates distinctly from a day count", () => {
    render(
      <UpcomingAssessments
        assessments={[
          row({ id: "a", title: "Today's Quiz", scheduled_at: daysFromNow(0) }),
          row({ id: "b", title: "Past Exam", scheduled_at: daysFromNow(-2) }),
        ]}
      />,
    );
    expect(screen.getByText("Today")).toBeInTheDocument();
    expect(screen.getByText("Past")).toBeInTheDocument();
  });
});
