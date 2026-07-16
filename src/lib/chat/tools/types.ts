import type { SupabaseClient } from "@supabase/supabase-js";
import type { z } from "zod";
import type { Database } from "@/lib/supabase/database.types";
import type { ToolDeclaration } from "@/ai/types";

export type ToolContext = {
  supabase: SupabaseClient<Database>;
  userId: string;
  /** Injected by the orchestrator from the resolved AIClient — lets search_memory/search_documents embed their query without every tool needing the whole client. */
  embedText: (text: string) => Promise<number[]>;
  /** Provenance for save_memory/propose_action — which conversation/message this call happened during. Null outside a real chat turn (e.g. tests). */
  conversationId: string | null;
  sourceMessageId: string | null;
};

/**
 * `DataTier` intentionally has no `"highly_sensitive"` member — the guard in
 * `registerTool` below checks for that literal string precisely so a future
 * tool author can't accidentally widen this type to include it and slip a
 * health/wellness/credentials tool past the check (PLAN.md §11/§14,
 * docs/DATA_CLASSIFICATION.md, task 8.8).
 */
export type DataTier = "ordinary" | "private";

export type ChatTool<Args = unknown> = {
  name: string;
  description: string;
  dataTier: DataTier;
  /** JSON Schema (standard, lowercase `type`) — translated to Gemini's Schema format by the provider adapter. */
  parameters: Record<string, unknown>;
  argsSchema: z.ZodType<Args>;
  execute: (ctx: ToolContext, args: Args) => Promise<unknown>;
};

const registry = new Map<string, ChatTool>();

/**
 * Registers a tool exactly once. Throws (at module-load time, not at
 * request time) if `dataTier` is anything other than the two allowed
 * values or if the name collides — both are programmer errors that must
 * never reach a live request.
 */
export function registerTool<Args>(tool: ChatTool<Args>): void {
  const tier: string = tool.dataTier;
  if (tier !== "ordinary" && tier !== "private") {
    throw new Error(
      `Tool "${tool.name}" declares dataTier "${tier}" — only "ordinary" and ` +
        `"private" are allowed. Highly sensitive data (health, wellness, ` +
        `credentials) must never be exposed to chat by default — see ` +
        `docs/DATA_CLASSIFICATION.md.`,
    );
  }
  if (registry.has(tool.name)) {
    throw new Error(`Tool "${tool.name}" is already registered.`);
  }
  registry.set(tool.name, tool as ChatTool);
}

export function getRegisteredTool(name: string): ChatTool | undefined {
  return registry.get(name);
}

export function listToolDeclarations(): ToolDeclaration[] {
  return [...registry.values()].map((tool) => ({
    name: tool.name,
    description: tool.description,
    parameters: tool.parameters,
  }));
}

export function listRegisteredTools(): ChatTool[] {
  return [...registry.values()];
}

/** Test-only: clears the registry so tool files can be re-imported in isolation across test files. */
export function _resetRegistryForTests(): void {
  registry.clear();
}

export function clampLimit(
  value: number | undefined,
  fallback: number,
  max: number,
): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0)
    return fallback;
  return Math.min(Math.floor(value), max);
}
