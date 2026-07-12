import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: {
      getUser: async () => ({ data: { user: { email: "test@example.com" } } }),
    },
  }),
}));

const { default: Page } = await import("./page");

describe("Today page", () => {
  it("greets the signed-in user", async () => {
    render(await Page());
    expect(screen.getByRole("main")).toBeInTheDocument();
    expect(screen.getByText(/hi, test/i)).toBeInTheDocument();
  });
});
