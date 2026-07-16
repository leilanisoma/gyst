import { z } from "zod";
import { registerTool, clampLimit } from "./types";

const argsSchema = z.object({
  startDate: z.string(),
  endDate: z.string(),
  limit: z.number().optional(),
});

registerTool({
  name: "get_schedule",
  description:
    "List calendar events (Google Calendar sync, Canvas classes/exams, fixed commitments) between two ISO dates, plus Ishani's standing weekly recurring commitments (e.g. fencing practice) which repeat every week regardless of the date range. Use this for anything about her calendar, availability, or what's happening on a given day.",
  dataTier: "private",
  parameters: {
    type: "object",
    properties: {
      startDate: {
        type: "string",
        description: "ISO date (YYYY-MM-DD), inclusive.",
      },
      endDate: {
        type: "string",
        description: "ISO date (YYYY-MM-DD), inclusive.",
      },
      limit: {
        type: "integer",
        description: "Max events, default 30, max 100.",
      },
    },
    required: ["startDate", "endDate"],
  },
  argsSchema,
  async execute(ctx, args) {
    const { data: events, error: eventsError } = await ctx.supabase
      .from("events")
      .select(
        "id, title, start_at, end_at, all_day, location, kind, is_fixed_commitment, source",
      )
      .eq("user_id", ctx.userId)
      .is("deleted_at", null)
      .gte("start_at", `${args.startDate}T00:00:00Z`)
      .lte("start_at", `${args.endDate}T23:59:59Z`)
      .order("start_at", { ascending: true })
      .limit(clampLimit(args.limit, 30, 100));
    if (eventsError) throw new Error(eventsError.message);

    const { data: recurring, error: recurringError } = await ctx.supabase
      .from("recurring_schedules")
      .select(
        "id, title, day_of_week, start_time, end_time, location, category",
      )
      .eq("user_id", ctx.userId)
      .eq("active", true);
    if (recurringError) throw new Error(recurringError.message);

    return {
      events: events ?? [],
      recurringCommitments: recurring ?? [],
    };
  },
});
