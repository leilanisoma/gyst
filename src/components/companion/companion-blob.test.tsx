import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CompanionBlob } from "./companion-blob";
import { COMPANION_STATE_LABELS, type CompanionState } from "@/lib/companion";

describe("CompanionBlob", () => {
  it.each(Object.keys(COMPANION_STATE_LABELS) as CompanionState[])(
    "renders the %s state with an accessible label",
    (state) => {
      render(<CompanionBlob state={state} />);
      expect(
        screen.getByRole("img", {
          name: `Companion is ${COMPANION_STATE_LABELS[state]}`,
        }),
      ).toBeInTheDocument();
    },
  );
});
