import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

/** Capture/check-in/outcomes live inside the journal popup (Phase 9D,
 * 2026-07-20); timeline/tasks/goals live inside the planner popup. */
async function openJournal() {
  const user = userEvent.setup();
  await user.click(screen.getByRole("button", { name: "Journal" }));
}

async function openPlanner() {
  const user = userEvent.setup();
  await user.click(
    screen.getByRole("button", { name: "Open today and this week" }),
  );
}

function queryBuilder(result: { data: unknown }) {
  const builder: Record<string, unknown> = {};
  const chain = () => builder;
  builder.select = chain;
  builder.eq = chain;
  builder.neq = chain;
  builder.is = chain;
  builder.lt = chain;
  builder.lte = chain;
  builder.gt = chain;
  builder.order = chain;
  builder.limit = chain;
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
  it("greets the signed-in user by first name", async () => {
    render(await Page({ searchParams: Promise.resolve({}) }));
    expect(screen.getByRole("main")).toBeInTheDocument();
    expect(screen.getByText(/, test\.$/i)).toBeInTheDocument();
  });

  it("shows overdue and due-today sections in the planner popup by default", async () => {
    render(await Page({ searchParams: Promise.resolve({}) }));
    await openPlanner();
    expect(screen.getByText("Overdue")).toBeInTheDocument();
    expect(screen.getByText("Due today")).toBeInTheDocument();
  });

  it("shows a 7-day grouping in week view", async () => {
    render(await Page({ searchParams: Promise.resolve({ view: "week" }) }));
    await openPlanner();
    expect(screen.getAllByText(/nothing due this day/i)).toHaveLength(7);
  });

  it("shows the daily check-in card in the journal popup", async () => {
    render(await Page({ searchParams: Promise.resolve({}) }));
    await openJournal();
    expect(screen.getByText(/how.s today/i)).toBeInTheDocument();
  });

  it("shows the top-outcomes prompt in the journal popup", async () => {
    render(await Page({ searchParams: Promise.resolve({}) }));
    await openJournal();
    expect(
      screen.getByText(/if today goes well, what.s true/i),
    ).toBeInTheDocument();
  });

  it("shows the time-block suggestions and weekly goals sections in the planner popup", async () => {
    render(await Page({ searchParams: Promise.resolve({}) }));
    await openPlanner();
    expect(screen.getByText("Suggested time blocks")).toBeInTheDocument();
    expect(screen.getByText(/this week.s goals/i)).toBeInTheDocument();
  });
});
