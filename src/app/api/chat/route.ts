import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getAIClient } from "@/ai";
import { runChatTurn } from "@/lib/chat/orchestrator";

const BodySchema = z.object({
  conversationId: z.string().uuid(),
  message: z.string().min(1).max(8000),
});

/**
 * Streams one chat turn back to the browser over SSE. The underlying model
 * call in `AIClient.chat` is non-streaming (see src/ai/client.ts and
 * docs/PHASES/phase-8.md) — this route gets a complete answer from
 * `runChatTurn` and then flushes it to the client word-by-word, so the UI
 * still gets real incremental rendering over the wire even though
 * generation itself wasn't token-streamed.
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) {
    return Response.json({ error: "Not signed in." }, { status: 401 });
  }

  const aiClient = getAIClient();
  if (!aiClient) {
    return Response.json(
      { error: "Chat isn't available yet — no AI provider is configured." },
      { status: 503 },
    );
  }

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  const parsedBody = BodySchema.safeParse(rawBody);
  if (!parsedBody.success) {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }
  const { conversationId, message } = parsedBody.data;

  const { data: conversation } = await supabase
    .from("conversations")
    .select("id")
    .eq("id", conversationId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!conversation) {
    return Response.json({ error: "Conversation not found." }, { status: 404 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("timezone")
    .eq("id", user.id)
    .maybeSingle();

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (payload: Record<string, unknown>) => {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(payload)}\n\n`),
        );
      };

      try {
        const result = await runChatTurn({
          supabase,
          aiClient,
          userId: user.id,
          conversationId,
          userMessage: message,
          now: new Date(),
          timezone: profile?.timezone ?? "UTC",
        });

        if (!result.ok) {
          send({ type: "error", error: result.error });
          return;
        }

        for (const word of result.text.split(/(\s+)/)) {
          if (!word) continue;
          send({ type: "delta", text: word });
          if (word.trim())
            await new Promise((resolve) => setTimeout(resolve, 12));
        }
        send({ type: "done", assistantMessageId: result.assistantMessageId });
      } catch (err) {
        send({
          type: "error",
          error: err instanceof Error ? err.message : "Chat failed.",
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
