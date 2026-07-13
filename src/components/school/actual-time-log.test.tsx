import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ActualTimeLog } from "./actual-time-log";

describe("ActualTimeLog", () => {
  it("renders nothing when there's nothing to log", () => {
    const { container } = render(<ActualTimeLog rows={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("shows the predicted estimate for each completed task missing actual time", () => {
    render(
      <ActualTimeLog
        rows={[
          { taskId: "t1", title: "Problem Set 3", predictedMinutes: 90 },
          { taskId: "t2", title: "Milestone: Start Term Paper", predictedMinutes: null },
        ]}
      />,
    );
    expect(screen.getByText("Problem Set 3")).toBeInTheDocument();
    expect(screen.getByText("Predicted 90 min")).toBeInTheDocument();
    expect(screen.getByText("No estimate on record")).toBeInTheDocument();
  });
});
