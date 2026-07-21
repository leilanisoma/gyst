import type { AIClient } from "../client";
import type {
  ChatTurnResult,
  EducationFitResult,
  ExtractionResult,
  GmailExtractionResult,
  SyllabusExtractionResult,
} from "../types";
import { buildGmailExtractionPrompt } from "../prompts/gmail-extraction";

const BASE_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "openai/gpt-oss-120b";

const GMAIL_JSON_SHAPE =
  `Respond with only a JSON object of this exact shape, no other text: ` +
  `{"items": [{"kind": "interview" | "confirmation" | "deadline" | ` +
  `"action" | "other", "title": string, "excerpt": string | null, ` +
  `"date": string | null, "requestedAction": string | null, ` +
  `"confidence": number}]}`;

class GroqApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

function unsupported(method: string): never {
  throw new Error(
    `Groq provider only supports Gmail extraction; ${method} is not implemented.`,
  );
}

async function chatCompletion(apiKey: string, prompt: string): Promise<unknown> {
  const response = await fetch(BASE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new GroqApiError(
      `Groq API request failed (${response.status}): ${body}`,
      response.status,
    );
  }

  const body = await response.json();
  const text = body.choices?.[0]?.message?.content;
  if (typeof text !== "string") {
    throw new GroqApiError("Groq returned no message content.", response.status);
  }
  return JSON.parse(text);
}

/**
 * Groq adapter for the provider-neutral AIClient interface — used only for
 * Gmail extraction (docs/DECISIONS/0003-groq-for-gmail-extraction.md), never
 * as the global `AI_PROVIDER`. Chat, inbox, and syllabus extraction stay on
 * Gemini, so only `extractGmailMessage` is implemented; the rest throw
 * rather than silently doing the wrong thing if ever called by mistake.
 * Groq has no `responseSchema`-style structured-output param on this model,
 * so the JSON shape is spelled out in the prompt instead — same
 * "AI output is untrusted regardless of requested schema" caveat as Gemini
 * applies here too (the caller re-validates with `GmailExtractionResultSchema`).
 */
export function createGroqClient(apiKey: string): AIClient {
  return {
    provider: "groq",

    async extractInboxItem(): Promise<ExtractionResult> {
      unsupported("extractInboxItem");
    },

    async extractSyllabusItems(): Promise<SyllabusExtractionResult> {
      unsupported("extractSyllabusItems");
    },

    async extractGmailMessage(
      messageText: string,
    ): Promise<GmailExtractionResult> {
      const prompt = `${buildGmailExtractionPrompt(messageText)}\n\n${GMAIL_JSON_SHAPE}`;
      const result = await chatCompletion(apiKey, prompt);
      return result as GmailExtractionResult;
    },

    async chat(): Promise<ChatTurnResult> {
      unsupported("chat");
    },

    async embedText(): Promise<number[]> {
      unsupported("embedText");
    },

    async classifyEducationFit(): Promise<EducationFitResult> {
      unsupported("classifyEducationFit");
    },
  };
}
