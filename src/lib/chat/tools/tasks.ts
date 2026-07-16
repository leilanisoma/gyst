import { z } from "zod";
import { registerTool, clampLimit } from "./types";
import { TASK_STATUSES, TASK_AREAS } from "@/lib/tasks";

const argsSchema = z.object({
  status: z.enum(TASK_STATUSES as unknown as [string, ...string[]]).optional(),
  area: z.enum(TASK_AREAS).optional(),
  dueBefore: z.string().optional(),
  dueAfter: z.string().optional(),
  limit: z.number().optional(),
});

registerTool({
  name: "get_tasks",
  description:
    "List Ishani's tasks (the universal task board), optionally filtered by status, area, and due-date range. Use this for anything about what's on her list, what's overdue, or what's due soon. Does not include school assessments/assignments or recruiting applications directly — use get_school_overview / get_recruiting_overview for those.",
  dataTier: "ordinary",
  parameters: {
    type: "object",
    properties: {
      status: {
        type: "string",
        enum: TASK_STATUSES,
        description: "Filter by task status.",
      },
      area: {
        type: "string",
        enum: TASK_AREAS,
        description: "Filter by area.",
      },
      dueBefore: {
        type: "string",
        description:
          "ISO date (YYYY-MM-DD) — only tasks due on or before this date.",
      },
      dueAfter: {
        type: "string",
        description:
          "ISO date (YYYY-MM-DD) — only tasks due on or after this date.",
      },
      limit: {
        type: "integer",
        description: "Max results, default 20, max 50.",
      },
    },
    required: [],
  },
  argsSchema,
  async execute(ctx, args) {
    let query = ctx.supabase
      .from("tasks")
      .select(
        "id, title, notes, area, status, priority, due_date, estimated_minutes, rollover_count",
      )
      .eq("user_id", ctx.userId)
      .order("due_date", { ascending: true, nullsFirst: false })
      .limit(clampLimit(args.limit, 20, 50));
    if (args.status) query = query.eq("status", args.status);
    if (args.area) query = query.eq("area", args.area);
    if (args.dueBefore) query = query.lte("due_date", args.dueBefore);
    if (args.dueAfter) query = query.gte("due_date", args.dueAfter);

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return { tasks: data ?? [] };
  },
});
