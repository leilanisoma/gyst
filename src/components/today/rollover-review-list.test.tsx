import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { RolloverReviewList } from "./rollover-review-list";
import type { Task } from "@/lib/tasks";

vi.mock("@/app/(app)/tasks/actions", () => ({
  rescheduleTaskToNextSlot: vi.fn(async () => ({ ok: true })),
  reduceTaskScope: vi.fn(async () => ({ ok: true })),
  deleteTask: vi.fn(async () => ({ ok: true })),
  updateTask: vi.fn(async () => ({ ok: true })),
}));

function task(overrides: Partial<Task>): Task {
  return {
    id: "id",
    title: "Task",
    notes: null,
    area: "general",
    status: "not_started",
    priority: "medium",
    estimated_minutes: null,
    due_date: "2026-07-10T00:00:00Z",
    rollover_count: 0,
    ...overrides,
  };
}

describe("RolloverReviewList", () => {
  it("shows the empty state when nothing is overdue", () => {
    render(<RolloverReviewList tasks={[]} />);
    expect(screen.getByText("Nothing overdue.")).toBeInTheDocument();
  });

  it("offers a single reschedule action on a first miss", () => {
    render(<RolloverReviewList tasks={[task({ rollover_count: 0 })]} />);
    expect(
      screen.getByRole("button", { name: /push to next feasible slot/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /reduce scope/i }),
    ).not.toBeInTheDocument();
  });

  it("offers reduce/break down/reschedule/delete on a repeated miss", () => {
    render(<RolloverReviewList tasks={[task({ rollover_count: 2 })]} />);
    expect(screen.getByText(/slipped 2 times/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /reduce scope/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /break down/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /reschedule/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /delete/i })).toBeInTheDocument();
  });
});
