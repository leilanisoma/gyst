import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { XpGrowthVisual } from "./xp-growth-visual";

describe("XpGrowthVisual", () => {
  it("renders an ambient visual, not a visible number", () => {
    render(<XpGrowthVisual xp={42} daysEngaged={3} />);
    expect(screen.queryByText(/42/)).not.toBeInTheDocument();
    expect(screen.queryByText(/3\/7/)).not.toBeInTheDocument();
  });

  it("exposes the underlying counts for accessibility, not display", () => {
    render(<XpGrowthVisual xp={42} daysEngaged={3} />);
    const visual = screen.getByRole("img");
    expect(visual).toHaveAccessibleName(/42 XP/i);
    expect(visual).toHaveAttribute("title", expect.stringContaining("42 XP"));
  });
});
