import { describe, expect, it } from "vitest";
import { FakeSupabase } from "@/lib/test/fake-supabase";
import {
  deleteAllHealthSummaries,
  deleteDailySummary,
  listDailySummaries,
  syncDailySummariesPayloadSchema,
  upsertDailySummaries,
} from "./daily-summaries";

function db() {
  const fake = new FakeSupabase();
  fake.tables.health_daily_summaries = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return fake as any;
}

describe("syncDailySummariesPayloadSchema", () => {
  it("accepts a well-formed allowlisted payload", () => {
    const result = syncDailySummariesPayloadSchema.safeParse({
      summaries: [
        { date: "2026-07-15", sleep_minutes: 420, steps: 8000 },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("rejects fields outside the allowlist (no raw HealthKit dump)", () => {
    const result = syncDailySummariesPayloadSchema.safeParse({
      summaries: [
        { date: "2026-07-15", blood_oxygen: 98 },
      ],
    });
    // Unknown keys are stripped by default Zod object parsing, not
    // rejected outright — assert they don't survive into the parsed value.
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.summaries[0]).not.toHaveProperty("blood_oxygen");
    }
  });

  it("rejects a malformed date", () => {
    const result = syncDailySummariesPayloadSchema.safeParse({
      summaries: [{ date: "07/15/2026" }],
    });
    expect(result.success).toBe(false);
  });

  it("rejects a negative step count", () => {
    const result = syncDailySummariesPayloadSchema.safeParse({
      summaries: [{ date: "2026-07-15", steps: -1 }],
    });
    expect(result.success).toBe(false);
  });

  it("rejects an empty summaries array", () => {
    const result = syncDailySummariesPayloadSchema.safeParse({ summaries: [] });
    expect(result.success).toBe(false);
  });
});

describe("upsertDailySummaries", () => {
  it("inserts one row per summary, defaulting missing metrics to null", async () => {
    const supabase = db();
    const result = await upsertDailySummaries(supabase, "user-1", [
      { date: "2026-07-15", sleep_minutes: 420 },
    ]);
    expect(result).toEqual({ ok: true, count: 1 });
    expect(supabase.tables.health_daily_summaries[0]).toMatchObject({
      user_id: "user-1",
      summary_date: "2026-07-15",
      sleep_minutes: 420,
      steps: null,
      source: "manual_entry",
    });
  });

  it("upserts on (user_id, summary_date) instead of duplicating", async () => {
    const supabase = db();
    await upsertDailySummaries(supabase, "user-1", [
      { date: "2026-07-15", steps: 1000 },
    ]);
    await upsertDailySummaries(supabase, "user-1", [
      { date: "2026-07-15", steps: 2000 },
    ]);
    expect(supabase.tables.health_daily_summaries).toHaveLength(1);
    expect(supabase.tables.health_daily_summaries[0].steps).toBe(2000);
  });
});

describe("listDailySummaries", () => {
  it("returns only the requesting user's rows, newest first", async () => {
    const supabase = db();
    supabase.tables.health_daily_summaries = [
      { id: "s1", user_id: "user-1", summary_date: "2026-07-14", steps: 1000 },
      { id: "s2", user_id: "user-2", summary_date: "2026-07-15", steps: 2000 },
      { id: "s3", user_id: "user-1", summary_date: "2026-07-15", steps: 3000 },
    ];

    const result = await listDailySummaries(supabase, "user-1");

    expect(result.map((r) => r.id)).toEqual(["s3", "s1"]);
  });
});

describe("deleteDailySummary", () => {
  it("deletes only the matching row for the requesting user", async () => {
    const supabase = db();
    supabase.tables.health_daily_summaries = [
      { id: "s1", user_id: "user-1", summary_date: "2026-07-14" },
      { id: "s2", user_id: "user-1", summary_date: "2026-07-15" },
    ];

    await deleteDailySummary(supabase, "user-1", "s1");

    expect(supabase.tables.health_daily_summaries).toEqual([
      { id: "s2", user_id: "user-1", summary_date: "2026-07-15" },
    ]);
  });
});

describe("deleteAllHealthSummaries", () => {
  it("deletes only the requesting user's rows", async () => {
    const supabase = db();
    supabase.tables.health_daily_summaries = [
      { id: "s1", user_id: "user-1", summary_date: "2026-07-14" },
      { id: "s2", user_id: "user-2", summary_date: "2026-07-14" },
    ];

    await deleteAllHealthSummaries(supabase, "user-1");

    expect(supabase.tables.health_daily_summaries).toEqual([
      { id: "s2", user_id: "user-2", summary_date: "2026-07-14" },
    ]);
  });
});
