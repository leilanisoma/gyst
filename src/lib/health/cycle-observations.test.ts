import { beforeAll, describe, expect, it } from "vitest";
import { FakeSupabase } from "@/lib/test/fake-supabase";
import {
  cycleObservationEntrySchema,
  deleteAllCycleObservations,
  deleteCycleObservation,
  listCycleObservations,
  parseCycleCsv,
  upsertCycleObservationEntry,
  upsertCycleObservations,
} from "./cycle-observations";

beforeAll(() => {
  process.env.ENCRYPTION_KEY = Buffer.alloc(32, 9).toString("base64");
});

function db() {
  const fake = new FakeSupabase();
  fake.tables.cycle_observations = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return fake as any;
}

describe("parseCycleCsv", () => {
  it("parses a well-formed CSV with all columns", () => {
    const csv =
      "date,flow,symptoms,note\n" +
      "2026-07-01,medium,cramps;fatigue,Felt okay overall\n" +
      "2026-07-02,light,,";
    const result = parseCycleCsv(csv);
    expect(result.errors).toEqual([]);
    expect(result.rows).toEqual([
      {
        observation_date: "2026-07-01",
        flow: "medium",
        symptoms: ["cramps", "fatigue"],
        note: "Felt okay overall",
      },
      {
        observation_date: "2026-07-02",
        flow: "light",
        symptoms: [],
        note: null,
      },
    ]);
  });

  it("works with only the required date column", () => {
    const csv = "date\n2026-07-01\n2026-07-02";
    const result = parseCycleCsv(csv);
    expect(result.errors).toEqual([]);
    expect(result.rows).toHaveLength(2);
  });

  it("supports quoted notes containing commas", () => {
    const csv = 'date,note\n2026-07-01,"cramps, but manageable"';
    const result = parseCycleCsv(csv);
    expect(result.errors).toEqual([]);
    expect(result.rows[0].note).toBe("cramps, but manageable");
  });

  it("reports a missing date column instead of guessing", () => {
    const csv = "flow,note\nlight,hi";
    const result = parseCycleCsv(csv);
    expect(result.rows).toEqual([]);
    expect(result.errors).toEqual([
      "Missing required 'date' column in the header row.",
    ]);
  });

  it("skips and reports a row with an invalid date", () => {
    const csv = "date,flow\n07/01/2026,light\n2026-07-02,light";
    const result = parseCycleCsv(csv);
    expect(result.rows).toHaveLength(1);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toContain("Line 2");
  });

  it("skips and reports a row with an unknown symptom", () => {
    const csv = "date,symptoms\n2026-07-01,cramps;made_up_symptom";
    const result = parseCycleCsv(csv);
    expect(result.rows).toHaveLength(0);
    expect(result.errors[0]).toContain("made_up_symptom");
  });

  it("skips and reports a row with an unknown flow value", () => {
    const csv = "date,flow\n2026-07-01,gushing";
    const result = parseCycleCsv(csv);
    expect(result.rows).toHaveLength(0);
    expect(result.errors[0]).toContain("gushing");
  });
});

describe("upsertCycleObservations / listCycleObservations", () => {
  it("round-trips through encryption — the note is never stored in plaintext", async () => {
    const supabase = db();
    await upsertCycleObservations(
      supabase,
      "user-1",
      [
        {
          observation_date: "2026-07-01",
          flow: "medium",
          symptoms: ["cramps"],
          note: "a private note",
        },
      ],
      "manual_csv",
    );

    const stored = supabase.tables.cycle_observations[0];
    expect(stored.note_encrypted).not.toContain("a private note");

    const listed = await listCycleObservations(supabase, "user-1");
    expect(listed[0]).toMatchObject({
      observation_date: "2026-07-01",
      flow: "medium",
      symptoms: ["cramps"],
      note: "a private note",
      source: "manual_csv",
    });
  });

  it("upserts on (user_id, observation_date) instead of duplicating", async () => {
    const supabase = db();
    await upsertCycleObservations(
      supabase,
      "user-1",
      [{ observation_date: "2026-07-01", flow: "light", symptoms: [], note: null }],
      "manual_csv",
    );
    await upsertCycleObservations(
      supabase,
      "user-1",
      [{ observation_date: "2026-07-01", flow: "heavy", symptoms: [], note: null }],
      "manual_csv",
    );
    expect(supabase.tables.cycle_observations).toHaveLength(1);
    expect(supabase.tables.cycle_observations[0].flow).toBe("heavy");
  });
});

describe("cycleObservationEntrySchema", () => {
  it("accepts a well-formed hormone entry", () => {
    const result = cycleObservationEntrySchema.safeParse({
      observation_date: "2026-07-15",
      on_period: true,
      lh: 12.5,
      e3g: 40,
      pdg: 2.1,
      fsh: 6,
    });
    expect(result.success).toBe(true);
  });

  it("rejects a negative hormone reading", () => {
    const result = cycleObservationEntrySchema.safeParse({
      observation_date: "2026-07-15",
      lh: -1,
    });
    expect(result.success).toBe(false);
  });

  it("rejects a malformed date", () => {
    const result = cycleObservationEntrySchema.safeParse({
      observation_date: "07/15/2026",
    });
    expect(result.success).toBe(false);
  });
});

describe("upsertCycleObservationEntry", () => {
  it("inserts a new row with just the hormone/period fields set", async () => {
    const supabase = db();
    const result = await upsertCycleObservationEntry(supabase, "user-1", {
      observation_date: "2026-07-15",
      on_period: true,
      lh: 12.5,
      e3g: null,
      pdg: null,
      fsh: 6,
    });
    expect(result).toEqual({ ok: true });
    expect(supabase.tables.cycle_observations[0]).toMatchObject({
      user_id: "user-1",
      observation_date: "2026-07-15",
      on_period: true,
      lh: 12.5,
      fsh: 6,
    });
  });

  it("upserts on (user_id, observation_date) without clobbering flow/symptoms from a prior CSV import", async () => {
    const supabase = db();
    await upsertCycleObservations(
      supabase,
      "user-1",
      [
        {
          observation_date: "2026-07-15",
          flow: "medium",
          symptoms: ["cramps"],
          note: null,
        },
      ],
      "manual_csv",
    );

    await upsertCycleObservationEntry(supabase, "user-1", {
      observation_date: "2026-07-15",
      on_period: true,
      lh: 12.5,
      e3g: null,
      pdg: null,
      fsh: null,
    });

    expect(supabase.tables.cycle_observations).toHaveLength(1);
    expect(supabase.tables.cycle_observations[0]).toMatchObject({
      flow: "medium",
      symptoms: ["cramps"],
      on_period: true,
      lh: 12.5,
    });
  });
});

describe("deleteCycleObservation / deleteAllCycleObservations", () => {
  it("deletes a single observation scoped to the requesting user", async () => {
    const supabase = db();
    supabase.tables.cycle_observations = [
      { id: "c1", user_id: "user-1", observation_date: "2026-07-01" },
      { id: "c2", user_id: "user-1", observation_date: "2026-07-02" },
    ];

    await deleteCycleObservation(supabase, "user-1", "c1");

    expect(supabase.tables.cycle_observations).toEqual([
      { id: "c2", user_id: "user-1", observation_date: "2026-07-02" },
    ]);
  });

  it("deletes every observation for the user and no one else's", async () => {
    const supabase = db();
    supabase.tables.cycle_observations = [
      { id: "c1", user_id: "user-1", observation_date: "2026-07-01" },
      { id: "c2", user_id: "user-2", observation_date: "2026-07-01" },
    ];

    await deleteAllCycleObservations(supabase, "user-1");

    expect(supabase.tables.cycle_observations).toEqual([
      { id: "c2", user_id: "user-2", observation_date: "2026-07-01" },
    ]);
  });
});
