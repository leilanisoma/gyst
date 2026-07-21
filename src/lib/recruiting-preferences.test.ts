import { describe, expect, it } from "vitest";
import { FakeSupabase } from "@/lib/test/fake-supabase";
import {
  getTargetGradYear,
  getWeeklyApplicationGoal,
  setWeeklyApplicationGoal,
} from "./recruiting-preferences";

describe("getWeeklyApplicationGoal", () => {
  it("defaults to 5 when nothing is set", async () => {
    const db = new FakeSupabase();
    db.tables.preferences = [{ id: "user-1", recruiting_preferences: {} }];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(await getWeeklyApplicationGoal(db as any, "user-1")).toBe(5);
  });

  it("reads back whatever was set, without clobbering target_grad_year", async () => {
    const db = new FakeSupabase();
    db.tables.preferences = [
      { id: "user-1", recruiting_preferences: { target_grad_year: 2027 } },
    ];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await setWeeklyApplicationGoal(db as any, "user-1", 8);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(await getWeeklyApplicationGoal(db as any, "user-1")).toBe(8);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(await getTargetGradYear(db as any, "user-1")).toBe(2027);
  });
});
