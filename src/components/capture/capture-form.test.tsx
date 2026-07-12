import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CaptureForm } from "./capture-form";

const captureInboxItem = vi.fn(async (text: string) => {
  void text;
  return { ok: true as const };
});

vi.mock("@/app/(app)/inbox/actions", () => ({
  captureInboxItem: (text: string) => captureInboxItem(text),
}));

afterEach(() => {
  captureInboxItem.mockClear();
});

describe("CaptureForm", () => {
  it("saves text and clears the field", async () => {
    const user = userEvent.setup();
    render(<CaptureForm />);

    const textarea = screen.getByPlaceholderText(/dump a thought/i);
    await user.type(textarea, "email professor about extension");
    await user.click(screen.getByRole("button", { name: /capture/i }));

    expect(captureInboxItem).toHaveBeenCalledWith(
      "email professor about extension",
    );
    await screen.findByPlaceholderText(/dump a thought/i);
    expect(textarea).toHaveValue("");
  });

  it("does not submit empty input", async () => {
    render(<CaptureForm />);
    expect(screen.getByRole("button", { name: /capture/i })).toBeDisabled();
    expect(captureInboxItem).not.toHaveBeenCalled();
  });
});
