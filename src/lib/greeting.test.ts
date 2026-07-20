import { describe, expect, it } from "vitest";
import { greetingPhraseFromHour } from "./greeting";

describe("greetingPhraseFromHour", () => {
  it("teases about being up late overnight", () => {
    expect(greetingPhraseFromHour(0)).toBe("Still up?");
    expect(greetingPhraseFromHour(4)).toBe("Still up?");
  });

  it("teases about being up early at dawn", () => {
    expect(greetingPhraseFromHour(5)).toBe("Up early?");
    expect(greetingPhraseFromHour(7)).toBe("Up early?");
  });

  it("says good morning through late morning", () => {
    expect(greetingPhraseFromHour(8)).toBe("Good morning");
    expect(greetingPhraseFromHour(11)).toBe("Good morning");
  });

  it("says good afternoon midday to late afternoon", () => {
    expect(greetingPhraseFromHour(12)).toBe("Good afternoon");
    expect(greetingPhraseFromHour(16)).toBe("Good afternoon");
  });

  it("says good evening in the evening", () => {
    expect(greetingPhraseFromHour(17)).toBe("Good evening");
    expect(greetingPhraseFromHour(20)).toBe("Good evening");
  });

  it("teases about being up late again at night", () => {
    expect(greetingPhraseFromHour(21)).toBe("Still up?");
    expect(greetingPhraseFromHour(23)).toBe("Still up?");
  });
});
