import { describe, expect, it } from "vitest";
import { defaultCapacityMinutes } from "./check-ins";

describe("defaultCapacityMinutes", () => {
  it("increases with energy level", () => {
    expect(defaultCapacityMinutes("low")).toBeLessThan(
      defaultCapacityMinutes("medium"),
    );
    expect(defaultCapacityMinutes("medium")).toBeLessThan(
      defaultCapacityMinutes("high"),
    );
  });
});
