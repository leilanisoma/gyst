import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { OpportunityForm } from "./opportunity-form";

vi.mock("@/app/(app)/recruiting/actions", () => ({
  createOpportunity: vi.fn(async () => ({ ok: true as const })),
}));

describe("OpportunityForm", () => {
  it("stays closed by default with empty fields", () => {
    render(<OpportunityForm />);
    expect(screen.queryByLabelText(/company/i)).not.toBeInTheDocument();
  });

  it("opens pre-filled from initialValues (the bookmarklet capture flow)", () => {
    render(
      <OpportunityForm
        defaultOpen
        initialValues={{
          url: "https://example.com/jobs/123",
          title: "Product Manager Intern",
          companyName: "Acme Inc.",
        }}
      />,
    );

    expect(screen.getByLabelText("Company")).toHaveValue("Acme Inc.");
    expect(screen.getByLabelText("Role title")).toHaveValue("Product Manager Intern");
    expect(screen.getByLabelText(/job posting url/i)).toHaveValue("https://example.com/jobs/123");
  });
});
