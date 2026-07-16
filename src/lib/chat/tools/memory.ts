import { z } from "zod";
import { registerTool } from "./types";

const MEMORY_KINDS = ["fact", "preference", "goal", "decision"] as const;

const argsSchema = z.object({
  text: z.string().min(1).max(2000),
  kind: z.enum(MEMORY_KINDS),
  confidence: z.number().min(0).max(1).optional(),
  trigger: z.enum(["explicit", "model_suggested"]),
});

registerTool({
  name: "save_memory",
  description:
    "Propose saving a durable fact, preference, goal, or decision to long-term memory. Use trigger='explicit' when Ishani directly asked you to remember something, and trigger='model_suggested' when you noticed something worth remembering on your own. This never silently overwrites anything — it always lands in a reviewable queue on the Memory page (status starts 'pending') for her to confirm, edit, or discard. Never save health/wellness data, academic records, email bodies, or credentials this way — those are excluded from automatic memory by policy.",
  dataTier: "private",
  parameters: {
    type: "object",
    properties: {
      text: {
        type: "string",
        description: "The fact/preference/goal/decision, in Ishani's terms.",
      },
      kind: { type: "string", enum: MEMORY_KINDS },
      confidence: {
        type: "number",
        description: "0-1, how confident you are this is worth remembering.",
      },
      trigger: {
        type: "string",
        enum: ["explicit", "model_suggested"],
        description:
          "'explicit' if she asked you to remember this; 'model_suggested' otherwise.",
      },
    },
    required: ["text", "kind", "trigger"],
  },
  argsSchema,
  async execute(ctx, args) {
    let embedding: number[] | null = null;
    try {
      embedding = await ctx.embedText(args.text);
    } catch {
      // Search stays degraded (not broken) if embedding fails — the memory
      // item itself still gets saved to the review queue either way.
      embedding = null;
    }

    const { data, error } = await ctx.supabase
      .from("memory_items")
      .insert({
        user_id: ctx.userId,
        kind: args.kind,
        text: args.text,
        confidence: args.confidence ?? null,
        source: args.trigger,
        source_message_id: ctx.sourceMessageId,
        status: "pending",
        embedding,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);

    return {
      memoryItemId: data.id,
      status: "pending",
      message: "Saved to the Memory review queue — not confirmed yet.",
    };
  },
});
