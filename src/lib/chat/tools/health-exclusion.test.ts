import { describe, expect, it } from "vitest";
import { listRegisteredTools } from "./types";
import "./index";

/**
 * Task 8.8: health/wellness data must be excluded from chat by default. No
 * wellness tables exist yet (Phase 9), so there's nothing live to query
 * against — this instead asserts the two things that will still hold once
 * Phase 9 adds `health_daily_summaries`/`cycle_observations`: (1) nothing in
 * today's tool registry references health/wellness/check-in data, and (2)
 * every registered tool's dataTier is one of the two allowed values (the
 * `registerTool` guard in registry.test.ts covers the enforcement
 * mechanism itself).
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
