import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { TaskEditSheet } from "./task-edit-sheet";
import type { Task } from "@/lib/tasks";

const updateTask = vi.fn(async (id: string, input: unknown) => {
  void id;
  void input;
  return { ok: true as const };
});

vi.mock("@/app/(app)/tasks/actions", () => ({
  updateTask: (id: string, input: unknown) => updateTask(id, input),
}));

const task: Task = {
  id: "task-1",
  title: "Email professor",
  notes: null,
  area: "school",
  status: "not_started",
  priority: "medium",
  estimated_minutes: 30,
  due_date: null,
  rollover_count: 0,
};

describe("TaskEditSheet", () => {
  it("saves edits with the trimmed title and parsed minutes", async () => {
    const user = userEvent.setup();
    render(<TaskEditSheet task={task} open onOpenChange={() => {}} />);

    const minutesInput = screen.getByLabelText(/estimated minutes/i);
    await user.clear(minutesInput);
    await user.type(minutesInput, "45");
    await user.click(screen.getByRole("button", { name: /save/i }));

    expect(updateTask).toHaveBeenCalledWith(
      "task-1",
      expect.objectContaining({
        title: "Email professor",
        estimated_minutes: 45,
      }),
    );
  });
});
