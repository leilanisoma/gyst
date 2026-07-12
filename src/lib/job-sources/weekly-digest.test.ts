import { describe, expect, it } from "vitest";
import { formatWeeklyDigestBody } from "./weekly-digest";

describe("formatWeeklyDigestBody", () => {
  it("returns null for a quiet week — no notification, no noise", () => {
    expect(formatWeeklyDigestBody({ newDiscoveries: 0, closingSoon: 0, followUpsDue: 0 })).toBeNull();
  });

  it("mentions only the non-zero counts", () => {
    expect(formatWeeklyDigestBody({ newDiscoveries: 3, closingSoon: 0, followUpsDue: 0 })).toBe(
      "3 new opportunities to triage.",
    );
    expect(formatWeeklyDigestBody({ newDiscoveries: 1, closingSoon: 0, followUpsDue: 0 })).toBe(
      "1 new opportunity to triage.",
    );
  });

  it("joins multiple non-zero counts", () => {
    expect(formatWeeklyDigestBody({ newDiscoveries: 2, closingSoon: 1, followUpsDue: 3 })).toBe(
      "2 new opportunities to triage, 1 closing within 14 days, 3 follow-ups due.",
    );
  });
});
