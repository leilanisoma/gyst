import { describe, expect, it } from "vitest";
import { registerTool } from "./types";

describe("registerTool", () => {
  it("registers a tool with an allowed dataTier", () => {
    expect(() =>
      registerTool({
        name: "test_registry_ordinary_tool",
        description: "test",
        dataTier: "ordinary",
        parameters: { type: "object", properties: {}, required: [] },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        argsSchema: { safeParse: () => ({ success: true, data: {} }) } as any,
        execute: async () => ({}),
      }),
    ).not.toThrow();
  });

  it("throws when the same tool name is registered twice", () => {
    registerTool({
      name: "test_registry_dup_tool",
      description: "test",
      dataTier: "ordinary",
      parameters: { type: "object", properties: {}, required: [] },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      argsSchema: { safeParse: () => ({ success: true, data: {} }) } as any,
      execute: async () => ({}),
    });
    expect(() =>
      registerTool({
        name: "test_registry_dup_tool",
        description: "test",
        dataTier: "ordinary",
        parameters: { type: "object", properties: {}, required: [] },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        argsSchema: { safeParse: () => ({ success: true, data: {} }) } as any,
        execute: async () => ({}),
      }),
    ).toThrow(/already registered/);
  });

  it("refuses to register a tool that declares dataTier 'highly_sensitive' (task 8.8 health-data exclusion guard)", () => {
    expect(() =>
      registerTool({
        name: "test_registry_health_tool",
        description: "a tool that would expose health/wellness data",
        // Cast past the type system the same way a careless future author
        // might, to prove the runtime guard — not just the TS type — is
        // what actually blocks this.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        dataTier: "highly_sensitive" as any,
        parameters: { type: "object", properties: {}, required: [] },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        argsSchema: { safeParse: () => ({ success: true, data: {} }) } as any,
        execute: async () => ({}),
      }),
    ).toThrow(/highly_sensitive/);
  });
});
