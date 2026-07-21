import { describe, expect, it } from "vitest";
import { FakeSupabase } from "@/lib/test/fake-supabase";
import { runDeadlineReminders } from "./tasks-deadline-reminders";

function inHours(hours: number): string {
  return new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
}

describe("runDeadlineReminders", () => {
  it("notifies once for a task due within 24h and marks it notified", async () => {
    const db = new FakeSupabase();
    db.tables.tasks = [
      {
        id: "task-1",
        user_id: "user-1",
        title: "Submit application",
        area: "recruiting",
        status: "not_started",
        due_date: inHours(2),
        deadline_notified_at: null,
      },
    ];
    db.tables.preferences = [{ id: "user-1", notification_rules: {} }];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await runDeadlineReminders(db as any, "user-1");

    expect(result).toEqual({ ok: true, notified: 1 });
    expect(db.tables.notifications).toHaveLength(1);
    expect(db.tables.notifications[0]).toMatchObject({
      kind: "deadline",
      link: "/recruiting",
    });
    expect(db.tables.tasks[0].deadline_notified_at).not.toBeNull();
  });

  it("skips tasks already notified, completed, or due outside the 24h window", async () => {
    const db = new FakeSupabase();
    db.tables.tasks = [
      {
        id: "task-already-notified",
        user_id: "user-1",
        title: "Already notified",
        area: "school",
        status: "not_started",
        due_date: inHours(1),
        deadline_notified_at: new Date().toISOString(),
      },
      {
        id: "task-completed",
        user_id: "user-1",
        title: "Done already",
        area: "school",
        status: "completed",
        due_date: inHours(1),
        deadline_notified_at: null,
      },
      {
        id: "task-far-out",
        user_id: "user-1",
        title: "Next month",
        area: "school",
        status: "not_started",
        due_date: inHours(24 * 30),
        deadline_notified_at: null,
      },
      {
        id: "task-past-due",
        user_id: "user-1",
        title: "Overdue already",
        area: "school",
        status: "not_started",
        due_date: inHours(-1),
        deadline_notified_at: null,
      },
    ];
    db.tables.preferences = [{ id: "user-1", notification_rules: {} }];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await runDeadlineReminders(db as any, "user-1");

    expect(result).toEqual({ ok: true, notified: 0 });
    expect(db.tables.notifications ?? []).toHaveLength(0);
  });
});
