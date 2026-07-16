import { z } from "zod";
import { registerTool } from "./types";
import {
  ACTION_TYPES,
  validateActionArguments,
} from "@/lib/chat/action-schemas";

const argsSchema = z.object({
  actionType: z.enum(ACTION_TYPES as unknown as [string, ...string[]]),
  arguments: z.record(z.string(), z.unknown()),
  preview: z.string().min(1),
});

registerTool({
  name: "propose_action",
  description:
    "Propose a write action (create_task, update_task, or create_goal) for Ishani to review. This ONLY creates a preview — it never performs the action itself. Always write `preview` as a short, human-readable summary of exactly what would happen (e.g. \"Create task 'Email advisor' due 2026-08-01\"). After calling this, tell her you've proposed it and that she needs to approve it in the UI — never say it's done.",
  dataTier: "ordinary",
  parameters: {
    type: "object",
    properties: {
      actionType: { type: "string", enum: ACTION_TYPES },
      arguments: {
        type: "object",
        description: "Arguments for the action — shape depends on actionType.",
      },
      preview: {
        type: "string",
        description: "Short human-readable summary of the proposed change.",
      },
    },
    required: ["actionType", "arguments", "preview"],
  },
  argsSchema,
  async execute(ctx, args) {
    const validated = validateActionArguments(args.actionType, args.arguments);
    if (!validated.ok) {
      return { status: "rejected", error: validated.error };
    }

    const { data, error } = await ctx.supabase
      .from("assistant_actions")
      .insert({
        user_id: ctx.userId,
        conversation_id: ctx.conversationId,
        source_message_id: ctx.sourceMessageId,
        action_type: args.actionType,
        arguments: validated.data as never,
        preview: args.preview,
        status: "proposed",
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);

    return {
      actionId: data.id,
      status: "proposed",
      message:
        "Proposed — awaiting Ishani's approval in the chat UI. This has NOT been done yet.",
    };
  },
});
