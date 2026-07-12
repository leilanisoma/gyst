import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

function queryBuilder(result: { data: unknown }) {
  const builder: Record<string, unknown> = {};
  const chain = () => builder;
  builder.select = chain;
  builder.eq = chain;
  builder.neq = chain;
  builder.order = chain;
  builder.maybeSingle = async () => result;
  builder.then = (resolve: (value: { data: unknown }) => void) =>
    resolve(result);
  return builder;
}

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: {
      getUser: async () => ({ data: { user: { email: "test@example.com" } } }),
    },
    from: (table: string) =>
      table === "profiles"
        ? queryBuilder({ data: { timezone: "UTC" } })
        : queryBuilder({ data: [] }),
  }),
}));

const { default: Page } = await import("./page");

describe("Today page", () => {
  it("greets the signed-in user", async () => {
    render(await Page({ searchParams: Promise.resolve({}) }));
    expect(screen.getByRole("main")).toBeInTheDocument();
    expect(screen.getByText(/hi, test/i)).toBeInTheDocument();
  });

  it("shows overdue and due-today sections by default", async () => {
    render(await Page({ searchParams: Promise.resolve({}) }));
    expect(screen.getByText("Overdue")).toBeInTheDocument();
    expect(screen.getByText("Due today")).toBeInTheDocument();
  });

  it("shows a 7-day grouping in week view", async () => {
    render(await Page({ searchParams: Promise.resolve({ view: "week" }) }));
    expect(screen.getAllByText(/nothing due this day/i)).toHaveLength(7);
  });

  it("shows the daily check-in card in today view", async () => {
    render(await Page({ searchParams: Promise.resolve({}) }));
    expect(screen.getByText(/how.s today/i)).toBeInTheDocument();
  });

  it("shows the time-block suggestions section in today view", async () => {
    render(await Page({ searchParams: Promise.resolve({}) }));
    expect(screen.getByText("Suggested time blocks")).toBeInTheDocument();
  });
});
