import { z } from "zod";
import { registerTool, clampLimit } from "./types";

const argsSchema = z.object({
  limit: z.number().optional(),
});

registerTool({
  name: "get_school_overview",
  description:
    "Get active courses, upcoming assessments (exams/quizzes/projects, not dismissed), and assignments due soon that aren't submitted yet. Match assessments/assignments to a course by course_id against the returned courses list.",
  dataTier: "ordinary",
  parameters: {
    type: "object",
    properties: {
      limit: {
        type: "integer",
        description: "Max assessments/assignments each, default 15, max 40.",
      },
    },
    required: [],
  },
  argsSchema,
  async execute(ctx, args) {
    const limit = clampLimit(args.limit, 15, 40);

    const { data: courses, error: coursesError } = await ctx.supabase
      .from("courses")
      .select("id, title, course_code, term, instructor, active")
      .eq("user_id", ctx.userId)
      .eq("active", true);
    if (coursesError) throw new Error(coursesError.message);

    const { data: assessments, error: assessmentsError } = await ctx.supabase
      .from("assessments")
      .select(
        "id, course_id, title, kind, scheduled_at, location, preparation_status, confirmed",
      )
      .eq("user_id", ctx.userId)
      .is("dismissed_at", null)
      .order("scheduled_at", { ascending: true, nullsFirst: false })
      .limit(limit);
    if (assessmentsError) throw new Error(assessmentsError.message);

    const { data: assignments, error: assignmentsError } = await ctx.supabase
      .from("assignments")
      .select("id, course_id, title, due_at, points_possible, submitted")
      .eq("user_id", ctx.userId)
      .eq("submitted", false)
      .order("due_at", { ascending: true, nullsFirst: false })
      .limit(limit);
    if (assignmentsError) throw new Error(assignmentsError.message);

    return {
      courses: courses ?? [],
      assessments: assessments ?? [],
      assignments: assignments ?? [],
    };
  },
});
