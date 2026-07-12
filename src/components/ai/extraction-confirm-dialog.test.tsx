import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ExtractionConfirmDialog } from "./extraction-confirm-dialog";
import type { ExtractedItem } from "@/ai/types";

const items: ExtractedItem[] = [
  { type: "task", text: "email professor", confidence: 0.9 },
  { type: "note", text: "worried about econ midterm", confidence: 0.3 },
];

describe("ExtractionConfirmDialog", () => {
  it("pre-checks only high-confidence candidates and confirms just those", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();

    render(
      <ExtractionConfirmDialog
        open
        onOpenChange={() => {}}
        items={items}
        onConfirm={onConfirm}
      />,
    );

    expect(screen.getByText(/email professor/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /confirm/i }));

    expect(onConfirm).toHaveBeenCalledWith([items[0]]);
  });

  it("disables confirm when nothing is checked", async () => {
    const user = userEvent.setup();
    render(
      <ExtractionConfirmDialog
        open
        onOpenChange={() => {}}
        items={[items[1]]}
        onConfirm={vi.fn()}
      />,
    );

    const confirmButton = screen.getByRole("button", { name: /confirm/i });
    expect(confirmButton).toBeDisabled();
    await user.click(confirmButton);
    expect(confirmButton).toBeDisabled();
  });
});
