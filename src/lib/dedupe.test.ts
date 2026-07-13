import { describe, expect, it } from "vitest";
import { isLikelyDuplicateEvent, titlesAreSimilar } from "./dedupe";

describe("titlesAreSimilar", () => {
  it("matches identical titles regardless of case/punctuation", () => {
    expect(titlesAreSimilar("CS101 Midterm Exam", "cs101 midterm exam")).toBe(true);
  });

  it("matches when one title is a substring of the other", () => {
    expect(titlesAreSimilar("Midterm Exam", "CS101: Midterm Exam (Room 50)")).toBe(true);
  });

  it("does not match unrelated titles", () => {
    expect(titlesAreSimilar("Midterm Exam", "Office Hours")).toBe(false);
  });

  it("does not match two empty titles", () => {
    expect(titlesAreSimilar("", "")).toBe(false);
  });
});

describe("isLikelyDuplicateEvent", () => {
  const existing = [{ title: "CS101 Midterm Exam", startAt: new Date("2026-08-15T18:00:00Z") }];

  it("flags a same-title event within the time window as a duplicate", () => {
    expect(
      isLikelyDuplicateEvent(
        { title: "Midterm Exam", startAt: new Date("2026-08-15T18:15:00Z") },
        existing,
      ),
    ).toBe(true);
  });

  it("does not flag a similarly-titled event far outside the time window", () => {
    expect(
      isLikelyDuplicateEvent(
        { title: "Midterm Exam", startAt: new Date("2026-08-16T18:00:00Z") },
        existing,
      ),
    ).toBe(false);
  });

  it("does not flag a same-time event with an unrelated title", () => {
    expect(
      isLikelyDuplicateEvent(
        { title: "Fencing practice", startAt: new Date("2026-08-15T18:00:00Z") },
        existing,
      ),
    ).toBe(false);
  });
});
