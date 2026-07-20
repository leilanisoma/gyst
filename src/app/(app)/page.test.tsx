import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

/** Today's timeline/tasks/check-in/outcomes content now lives inside the
 * journal popup (Phase 9D, 2026-07-20), not directly on the page. */
async function openJournal() {
  const user = userEvent.setup();
  await user.click(screen.getByRole("button", { name: "Journal" }));
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
  it("greets the signed-in user", async () => {
    render(await Page({ searchParams: Promise.resolve({}) }));
    expect(screen.getByRole("main")).toBeInTheDocument();
    expect(screen.getByText(/hi, test/i)).toBeInTheDocument();
  });

  it("shows overdue and due-today sections in the journal popup by default", async () => {
    render(await Page({ searchParams: Promise.resolve({}) }));
    await openJournal();
    expect(screen.getByText("Overdue")).toBeInTheDocument();
    expect(screen.getByText("Due today")).toBeInTheDocument();
  });

  it("shows a 7-day grouping in week view", async () => {
    render(await Page({ searchParams: Promise.resolve({ view: "week" }) }));
    await openJournal();
    expect(screen.getAllByText(/nothing due this day/i)).toHaveLength(7);
  });

  it("shows the daily check-in card in today view", async () => {
    render(await Page({ searchParams: Promise.resolve({}) }));
    await openJournal();
    expect(screen.getByText(/how.s today/i)).toBeInTheDocument();
  });

  it("shows the time-block suggestions section in today view", async () => {
    render(await Page({ searchParams: Promise.resolve({}) }));
    await openJournal();
    expect(screen.getByText("Suggested time blocks")).toBeInTheDocument();
  });

  it("shows the top-outcomes prompt and weekly goals section in today view", async () => {
    render(await Page({ searchParams: Promise.resolve({}) }));
    await openJournal();
    expect(
      screen.getByText(/if today goes well, what.s true/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/this week.s goals/i)).toBeInTheDocument();
  });
});
