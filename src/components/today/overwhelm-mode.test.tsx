import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { OverwhelmMode } from "./overwhelm-mode";
import type { Task } from "@/lib/tasks";

function task(overrides: Partial<Task>): Task {
  return {
    id: overrides.id ?? "id",
    title: overrides.title ?? "Task",
    notes: null,
    area: "general",
    status: "not_started",
    priority: "medium",
    estimated_minutes: null,
    due_date: null,
    rollover_count: 0,
    ...overrides,
  };
}

describe("OverwhelmMode", () => {
  it("asks for energy first, then shows the smallest-day plan after a tap", async () => {
    const user = userEvent.setup();
    const tasks = [
      task({ id: "urgent", title: "Finish essay", priority: "high" }),
      task({ id: "small", title: "Do dishes", estimated_minutes: 10 }),
    ];
    render(
      <OverwhelmMode tasks={tasks} now={new Date("2026-07-11T12:00:00Z")} />,
    );

    await user.click(screen.getByRole("button", { name: /i.m overwhelmed/i }));
    expect(
      screen.getByText(/how.s your energy right now/i),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /^medium$/i }));

    expect(
      screen.getByText(/smallest day that still counts/i),
    ).toBeInTheDocument();
    expect(screen.getByText("Finish essay")).toBeInTheDocument();
  });
});
