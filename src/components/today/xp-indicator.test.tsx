import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { XpIndicator } from "./xp-indicator";

describe("XpIndicator", () => {
  it("shows a small xp and weekly-consistency readout, not a giant count", () => {
    render(<XpIndicator xp={42} daysEngaged={3} />);
    expect(screen.getByText(/42 xp/i)).toBeInTheDocument();
    expect(screen.getByText(/3\/7 days this week/i)).toBeInTheDocument();
  });
});
