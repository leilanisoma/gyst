import { describe, expect, it } from "vitest";
import { toPgVector } from "./embedding";

describe("toPgVector", () => {
  it("formats a numeric embedding as pgvector's text literal", () => {
    expect(toPgVector([0.1, 0.2, 0.3])).toBe("[0.1,0.2,0.3]");
  });

  it("handles an empty vector", () => {
    expect(toPgVector([])).toBe("[]");
  });
});
