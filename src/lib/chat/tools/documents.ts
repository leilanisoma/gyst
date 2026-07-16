import { z } from "zod";
import { registerTool, clampLimit } from "./types";
import { DOCUMENT_KINDS } from "@/lib/recruiting";

const argsSchema = z.object({
  kind: z.enum(DOCUMENT_KINDS as unknown as [string, ...string[]]).optional(),
  limit: z.number().optional(),
});

registerTool({
  name: "get_documents",
  description:
    "List stored document metadata (resumes, transcripts, cover letters, syllabi, job descriptions) — titles and kinds only, never file contents. To search inside document text, use search_documents instead.",
  dataTier: "private",
  parameters: {
    type: "object",
    properties: {
      kind: {
        type: "string",
        enum: DOCUMENT_KINDS,
        description: "Filter by document kind.",
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
      .from("documents")
      .select("id, kind, title, file_name, is_active, course_id, created_at")
      .eq("user_id", ctx.userId)
      .order("created_at", { ascending: false })
      .limit(clampLimit(args.limit, 20, 50));
    if (args.kind) query = query.eq("kind", args.kind);

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return { documents: data ?? [] };
  },
});
