import { z } from "zod";
import { registerTool, clampLimit } from "./types";
import { toPgVector } from "../embedding";

const argsSchema = z.object({
  query: z.string().min(1),
  limit: z.number().optional(),
});

registerTool({
  name: "search_memory",
  description:
    "Semantically search Ishani's saved memory (facts, preferences, goals, decisions she's confirmed or that were proposed) for anything relevant to a topic. Returns each match's own text — cite it directly when you use it.",
  dataTier: "private",
  parameters: {
    type: "object",
    properties: {
      query: {
        type: "string",
        description: "What to search for, in natural language.",
      },
      limit: {
        type: "integer",
        description: "Max results, default 5, max 10.",
      },
    },
    required: ["query"],
  },
  argsSchema,
  async execute(ctx, args) {
    const embedding = await ctx.embedText(args.query);
    const { data, error } = await ctx.supabase.rpc("match_memory_items", {
      p_user_id: ctx.userId,
      p_query_embedding: toPgVector(embedding),
      p_match_count: clampLimit(args.limit, 5, 10),
    });
    if (error) throw new Error(error.message);
    return { matches: data ?? [] };
  },
});

registerTool({
  name: "search_documents",
  description:
    "Semantically search the text of documents that have been indexed for search (resumes, transcripts, syllabi, job descriptions — see get_documents/index_document). Returns chunk excerpts with the source document_id and page, so you can cite exactly where an answer came from. Documents not yet indexed won't appear here.",
  dataTier: "private",
  parameters: {
    type: "object",
    properties: {
      query: {
        type: "string",
        description: "What to search for, in natural language.",
      },
      limit: {
        type: "integer",
        description: "Max results, default 5, max 10.",
      },
    },
    required: ["query"],
  },
  argsSchema,
  async execute(ctx, args) {
    const embedding = await ctx.embedText(args.query);
    const { data: matches, error } = await ctx.supabase.rpc(
      "match_document_chunks",
      {
        p_user_id: ctx.userId,
        p_query_embedding: toPgVector(embedding),
        p_match_count: clampLimit(args.limit, 5, 10),
      },
    );
    if (error) throw new Error(error.message);

    const documentIds = [...new Set((matches ?? []).map((m) => m.document_id))];
    const { data: documents, error: docsError } = documentIds.length
      ? await ctx.supabase
          .from("documents")
          .select("id, title, kind")
          .in("id", documentIds)
      : { data: [], error: null };
    if (docsError) throw new Error(docsError.message);

    return { matches: matches ?? [], documents: documents ?? [] };
  },
});
