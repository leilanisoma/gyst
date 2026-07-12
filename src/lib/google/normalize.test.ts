import { describe, expect, it } from "vitest";
import { normalizeGoogleEvent } from "./normalize";

describe("normalizeGoogleEvent", () => {
  it("normalizes a timed event to UTC instants and keeps the source timeZone", () => {
    const normalized = normalizeGoogleEvent({
      id: "evt1",
      status: "confirmed",
      summary: "Econ lecture",
      start: {
        dateTime: "2026-03-08T09:00:00-08:00",
        timeZone: "America/Los_Angeles",
      },
      end: {
        dateTime: "2026-03-08T10:30:00-08:00",
        timeZone: "America/Los_Angeles",
      },
    });

    expect(normalized.allDay).toBe(false);
    expect(normalized.startAt).toBe(
      new Date("2026-03-08T09:00:00-08:00").toISOString(),
    );
    expect(normalized.endAt).toBe(
      new Date("2026-03-08T10:30:00-08:00").toISOString(),
    );
    expect(normalized.timeZone).toBe("America/Los_Angeles");
    expect(normalized.title).toBe("Econ lecture");
    expect(normalized.sourceId).toBe("evt1");
    expect(normalized.recurringSourceId).toBeNull();
  });

  it("normalizes an all-day event using the date fields", () => {
    const normalized = normalizeGoogleEvent({
      id: "evt2",
      status: "confirmed",
      summary: "Fencing tournament",
      start: { date: "2026-04-01" },
      end: { date: "2026-04-02" },
    });

    expect(normalized.allDay).toBe(true);
    expect(normalized.startAt).toBe("2026-04-01T00:00:00.000Z");
    expect(normalized.endAt).toBe("2026-04-02T00:00:00.000Z");
  });

  it("carries recurringEventId through for expanded recurring instances", () => {
    const normalized = normalizeGoogleEvent({
      id: "evt3_20260309",
      status: "confirmed",
      recurringEventId: "evt3",
      start: {
        dateTime: "2026-03-09T09:00:00-07:00",
        timeZone: "America/Los_Angeles",
      },
      end: {
        dateTime: "2026-03-09T10:00:00-07:00",
        timeZone: "America/Los_Angeles",
      },
    });

    expect(normalized.recurringSourceId).toBe("evt3");
  });

  it("falls back to a placeholder title when summary is missing", () => {
    const normalized = normalizeGoogleEvent({
      id: "evt4",
      status: "confirmed",
      start: { dateTime: "2026-03-09T09:00:00Z" },
      end: { dateTime: "2026-03-09T10:00:00Z" },
    });

    expect(normalized.title).toBe("(untitled)");
  });
});
