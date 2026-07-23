import { describe, expect, it, vi } from "vitest";
import { FakeSupabase } from "@/lib/test/fake-supabase";
import type { GmailMessageContent, GmailMessageRef } from "./client";

const state: {
  refs: GmailMessageRef[];
  messages: Record<string, GmailMessageContent>;
} = { refs: [], messages: {} };

vi.mock("./client", () => ({
  listMessageIds: vi.fn(async () => state.refs),
  getMessage: vi.fn(async (_token: string, id: string) => state.messages[id]),
}));

vi.mock("./tokens", () => ({
  getValidGmailAccessToken: vi.fn(async () => "fake-access-token"),
}));

function reset() {
  state.refs = [];
  state.messages = {};
  vi.clearAllMocks();
}

function seedIntegration(db: FakeSupabase, settings: Record<string, unknown>) {
  db.tables.integrations = [
    { id: "int-1", user_id: "user-1", provider: "gmail", status: "connected", granted_scopes: [], account_email: "me@example.com", settings, last_synced_at: null, error: null },
  ];
}

describe("runGmailSync", () => {
  it("falls back to the default whole-mailbox-minus-promotions query when none is configured", async () => {
    reset();
    state.refs = [{ id: "m1", threadId: "t1" }];
    state.messages.m1 = {
      id: "m1",
      threadId: "t1",
      subject: "Interview",
      from: "recruiter@company.com",
      messageIdHeader: "<abc@mail.gmail.com>",
      snippet: "...",
      bodyText: "...",
    };
    const { runGmailSync } = await import("./sync");
    const db = new FakeSupabase();
    seedIntegration(db, {});

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await runGmailSync(db as any, "user-1");
    expect(result).toMatchObject({ ok: true, messagesScanned: 1 });

    const client = await import("./client");
    expect(vi.mocked(client.listMessageIds)).toHaveBeenCalledWith(
      "fake-access-token",
      "-category:promotions -category:social -in:spam -in:trash",
    );
  });

  it("errors clearly when Gmail isn't connected", async () => {
    reset();
    const tokens = await import("./tokens");
    vi.mocked(tokens.getValidGmailAccessToken).mockResolvedValueOnce(null);
    const { runGmailSync } = await import("./sync");
    const db = new FakeSupabase();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await runGmailSync(db as any, "user-1");
    expect(result).toEqual({ ok: false, error: "Gmail isn't connected." });
  });

  it("scans only new messages, marks them processed, and never re-fetches a message twice", async () => {
    reset();
    state.refs = [{ id: "m1", threadId: "t1" }];
    state.messages.m1 = {
      id: "m1",
      threadId: "t1",
      subject: "Interview",
      from: "recruiter@company.com",
      messageIdHeader: "<abc@mail.gmail.com>",
      snippet: "...",
      bodyText: "...",
    };

    const { runGmailSync } = await import("./sync");
    const db = new FakeSupabase();
    seedIntegration(db, { search_query: "label:job-search" });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const first = await runGmailSync(db as any, "user-1");
    expect(first).toMatchObject({ ok: true, messagesScanned: 1 });
    expect(db.tables.gmail_processed_messages).toHaveLength(1);
    expect(db.tables.sync_runs[0]).toMatchObject({ status: "success" });
    expect(db.tables.integrations[0]).toMatchObject({ status: "connected" });

    const client = await import("./client");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const second = await runGmailSync(db as any, "user-1");
    expect(second).toMatchObject({ ok: true, messagesScanned: 0 });
    expect(db.tables.gmail_processed_messages).toHaveLength(1);
    expect(vi.mocked(client.getMessage)).toHaveBeenCalledTimes(1);
  });

  it("records an error run and marks the integration errored when a Gmail call fails", async () => {
    reset();
    const client = await import("./client");
    vi.mocked(client.listMessageIds).mockRejectedValueOnce(new Error("Gmail returned 500"));

    const { runGmailSync } = await import("./sync");
    const db = new FakeSupabase();
    seedIntegration(db, { search_query: "label:job-search" });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await runGmailSync(db as any, "user-1");
    expect(result).toEqual({ ok: false, error: "Gmail returned 500" });
    expect(db.tables.integrations[0]).toMatchObject({ status: "error", error: "Gmail returned 500" });
    expect(db.tables.sync_runs[0]).toMatchObject({ status: "error" });
    expect(db.tables.notifications[0]).toMatchObject({ kind: "sync_error" });
  });
});
