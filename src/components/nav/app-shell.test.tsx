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
  it("renders every nav destination and the page content, with no separate Chat tab", () => {
    render(
      <AppShell
        email="test@example.com"
        notifications={[]}
        chatAvailable={true}
      >
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
      "Settings",
    ]) {
      expect(screen.getAllByText(label).length).toBeGreaterThan(0);
    }
    expect(screen.queryByText("Chat")).not.toBeInTheDocument();
  });

  it("shows the floating chat button when AI is available", () => {
    render(
      <AppShell
        email="test@example.com"
        notifications={[]}
        chatAvailable={true}
      >
        <p>page content</p>
      </AppShell>,
    );
    expect(
      screen.getByRole("button", { name: /open chat/i }),
    ).toBeInTheDocument();
  });

  it("hides the floating chat button when AI isn't configured", () => {
    render(
      <AppShell
        email="test@example.com"
        notifications={[]}
        chatAvailable={false}
      >
        <p>page content</p>
      </AppShell>,
    );
    expect(
      screen.queryByRole("button", { name: /open chat/i }),
    ).not.toBeInTheDocument();
  });
});
