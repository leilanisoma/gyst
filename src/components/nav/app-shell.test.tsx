import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AppShell } from "./app-shell";

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

vi.mock("@/app/login/actions", () => ({
  signOut: vi.fn(),
}));

describe("AppShell", () => {
  it("renders every nav destination and the page content", () => {
    render(
      <AppShell email="test@example.com" notifications={[]}>
        <p>page content</p>
      </AppShell>,
    );

    expect(screen.getByText("page content")).toBeInTheDocument();
    for (const label of [
      "Today",
      "Inbox",
      "Tasks",
      "Recruiting",
      "School",
      "Gmail",
      "Wellness",
      "Chat",
      "Settings",
    ]) {
      expect(screen.getAllByText(label).length).toBeGreaterThan(0);
    }
  });
});
