import { describe, expect, it } from "vitest";
import { FakeSupabase } from "@/lib/test/fake-supabase";
import {
  approveAssistantAction,
  rejectAssistantAction,
} from "./approve-action";

function seedAction(db: FakeSupabase, overrides: Record<string, unknown> = {}) {
  db.tables.assistant_actions = [
    {
      id: "action-1",
      user_id: "user-1",
      action_type: "create_task",
      arguments: { title: "Email advisor" },
      status: "proposed",
      ...overrides,
    },
  ];
}

describe("approveAssistantAction", () => {
  it("executes the real write and marks the action executed", async () => {
    const db = new FakeSupabase();
    db.tables.tasks = [];
    seedAction(db);

    const result = await approveAssistantAction(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      db as any,
      "user-1",
      "action-1",
    );

    expect(result).toEqual({ ok: true });
    expect(db.tables.tasks).toHaveLength(1);
    expect(db.tables.tasks![0]).toMatchObject({
      title: "Email advisor",
      source: "assistant",
    });
    expect(db.tables.assistant_actions![0].status).toBe("executed");
  });

  it("refuses to execute an action that isn't 'proposed' (no double-write on re-approval)", async () => {
    const db = new FakeSupabase();
    db.tables.tasks = [];
    seedAction(db, { status: "executed" });

    const result = await approveAssistantAction(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      db as any,
      "user-1",
      "action-1",
    );

    expect(result.ok).toBe(false);
    expect(db.tables.tasks).toHaveLength(0);
  });

  it("refuses to execute an action belonging to a different user", async () => {
    const db = new FakeSupabase();
    db.tables.tasks = [];
    seedAction(db);

    const result = await approveAssistantAction(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      db as any,
      "someone-else",
      "action-1",
    );

    expect(result).toEqual({ ok: false, error: "Action not found." });
    expect(db.tables.tasks).toHaveLength(0);
  });

  it("marks the action failed (not executed) when re-validation rejects the stored arguments", async () => {
    const db = new FakeSupabase();
    db.tables.tasks = [];
    seedAction(db, { arguments: { title: "" } }); // empty title fails CreateTaskActionSchema

    const result = await approveAssistantAction(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      db as any,
      "user-1",
      "action-1",
    );

    expect(result.ok).toBe(false);
    expect(db.tables.tasks).toHaveLength(0);
    expect(db.tables.assistant_actions![0].status).toBe("failed");
  });

  it("rejects an unknown action_type instead of executing anything", async () => {
    const db = new FakeSupabase();
    seedAction(db, { action_type: "delete_all_tasks" });

    const result = await approveAssistantAction(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      db as any,
      "user-1",
      "action-1",
    );

    expect(result.ok).toBe(false);
    expect(db.tables.assistant_actions![0].status).toBe("failed");
  });
});

describe("rejectAssistantAction", () => {
  it("marks a proposed action rejected", async () => {
    const db = new FakeSupabase();
    seedAction(db);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await rejectAssistantAction(db as any, "user-1", "action-1");

    expect(result).toEqual({ ok: true });
    expect(db.tables.assistant_actions![0].status).toBe("rejected");
  });
});
