import { describe, expect, it } from "vitest";
import { listRegisteredTools } from "./types";
import "./index";

/**
 * Task 8.8: health/wellness data must be excluded from chat by default.
 * Phase 9A added `wellness_check_ins` (Private tier) and Phase 9B added
 * `health_daily_summaries`/`cycle_observations` (Highly sensitive) — see
 * docs/DATA_CLASSIFICATION.md. By design, no chat tool reads any of them.
 * This asserts the two things that hold regardless of how many such tables
 * exist: (1) nothing in today's tool registry references
 * health/wellness/check-in data, and (2) every registered tool's dataTier
 * is one of the two allowed values (the `registerTool` guard in
 * registry.test.ts covers the enforcement mechanism itself — it throws at
 * module-load time if a tool ever declares `dataTier: "highly_sensitive"`).
 */
describe("chat tool registry health-data exclusion", () => {
  const tools = listRegisteredTools();

  it("has at least the expected read/write tools registered", () => {
    expect(tools.length).toBeGreaterThanOrEqual(8);
  });

  it("registers no tool named after health/wellness/cycle/check-in data", () => {
    // Descriptions may legitimately *mention* health data to say it's
    // excluded (see save_memory's description) — that's the policy working,
    // not a violation. A tool actually exposing it would be named after it.
    const forbidden = /health|wellness|cycle|check.?in|menstrual/i;
    for (const tool of tools) {
      expect(tool.name).not.toMatch(forbidden);
    }
  });

  it("every registered tool declares an allowed dataTier", () => {
    for (const tool of tools) {
      expect(["ordinary", "private"]).toContain(tool.dataTier);
    }
  });
});
