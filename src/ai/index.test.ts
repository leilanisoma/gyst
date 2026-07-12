import { describe, expect, it } from "vitest";
import { getAIClient, isAIExtractionEnabled } from "./index";

describe("AI extraction feature flag", () => {
  it("is disabled until a real provider adapter exists", () => {
    expect(isAIExtractionEnabled()).toBe(false);
    expect(getAIClient()).toBeNull();
  });
});
