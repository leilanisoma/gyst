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
  it("renders the top bar (home link, email, sign out) and the page content", () => {
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
    expect(screen.getByRole("link", { name: "gyst" })).toHaveAttribute(
      "href",
      "/",
    );
    expect(screen.getByText("test@example.com")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Sign out" }),
    ).toBeInTheDocument();
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
