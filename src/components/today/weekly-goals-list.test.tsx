import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { WeeklyGoalsList } from "./weekly-goals-list";

describe("WeeklyGoalsList", () => {
  it("shows an empty state when there are no weekly goals", () => {
    render(<WeeklyGoalsList goals={[]} />);
    expect(screen.getByText(/no weekly goals yet/i)).toBeInTheDocument();
  });

  it("lists each goal's title", () => {
    render(
      <WeeklyGoalsList
        goals={[
          { id: "1", title: "Ship the review flow", target_date: null },
          { id: "2", title: "Reply to three recruiters", target_date: null },
        ]}
      />,
    );
    expect(screen.getByText("Ship the review flow")).toBeInTheDocument();
    expect(screen.getByText("Reply to three recruiters")).toBeInTheDocument();
  });
});
