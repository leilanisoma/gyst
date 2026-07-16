import type { AIClient } from "../client";
import type {
  ExtractionResult,
  GmailExtractionResult,
  SyllabusExtractionResult,
} from "../types";
import { buildInboxExtractionPrompt } from "../prompts/inbox-extraction";
import { buildSyllabusExtractionPrompt } from "../prompts/syllabus-extraction";
import { buildGmailExtractionPrompt } from "../prompts/gmail-extraction";

const BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models";
const MODEL = "gemini-2.5-flash-lite";

class GeminiApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

type GeminiSchema = Record<string, unknown>;

/**
 * Calls Gemini's generateContent REST endpoint directly via fetch, matching
 * how every other external connector in this codebase talks to its
 * provider (src/lib/gmail/client.ts, src/lib/google/calendar.ts) instead of
 * adding an SDK dependency. `responseSchema` forces JSON matching the
 * shape, but the result is still untrusted model output — callers
 * (src/lib/syllabus/extract.ts, src/lib/gmail/extract.ts) re-validate with
 * the matching Zod schema before using it, same as every other AIClient
 * method.
 */
async function generateJson(
  apiKey: string,
  prompt: string,
  responseSchema: GeminiSchema,
): Promise<unknown> {
  const response = await fetch(
    `${BASE_URL}/${MODEL}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema,
        },
      }),
    },
  );

  if (!response.ok) {
    const body = await response.text();
    throw new GeminiApiError(
      `Gemini API request failed (${response.status}): ${body}`,
      response.status,
    );
  }

  const body = await response.json();
  const text = body.candidates?.[0]?.content?.parts?.[0]?.text;
  if (typeof text !== "string") {
    throw new GeminiApiError(
      "Gemini returned no text content.",
      response.status,
    );
  }
  return JSON.parse(text);
}

const INBOX_SCHEMA: GeminiSchema = {
  type: "OBJECT",
  properties: {
    items: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          type: { type: "STRING", enum: ["task", "note", "goal"] },
          text: { type: "STRING" },
          confidence: { type: "NUMBER" },
        },
        required: ["type", "text", "confidence"],
      },
    },
  },
  required: ["items"],
};

const SYLLABUS_SCHEMA: GeminiSchema = {
  type: "OBJECT",
  properties: {
    items: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          kind: { type: "STRING", enum: ["policy", "major_date", "other"] },
          title: { type: "STRING" },
          description: { type: "STRING", nullable: true },
          date: { type: "STRING", nullable: true },
          sourcePage: { type: "INTEGER", nullable: true },
          confidence: { type: "NUMBER" },
        },
        required: [
          "kind",
          "title",
          "description",
          "date",
          "sourcePage",
          "confidence",
        ],
      },
    },
  },
  required: ["items"],
};

const GMAIL_SCHEMA: GeminiSchema = {
  type: "OBJECT",
  properties: {
    items: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          kind: {
            type: "STRING",
            enum: ["interview", "confirmation", "deadline", "action", "other"],
          },
          title: { type: "STRING" },
          excerpt: { type: "STRING", nullable: true },
          date: { type: "STRING", nullable: true },
          requestedAction: { type: "STRING", nullable: true },
          confidence: { type: "NUMBER" },
        },
        required: [
          "kind",
          "title",
          "excerpt",
          "date",
          "requestedAction",
          "confidence",
        ],
      },
    },
  },
  required: ["items"],
};

/**
 * Gemini adapter for the provider-neutral AIClient interface (PLAN.md §4,
 * docs/DECISIONS/0002-gemini-ai-provider.md). Uses gemini-2.5-flash-lite —
 * cheap enough for this app's single-user extraction volume that model
 * choice isn't worth making configurable yet.
 */
export function createGeminiClient(apiKey: string): AIClient {
  return {
    provider: "gemini",

    async extractInboxItem(rawText: string): Promise<ExtractionResult> {
      const result = await generateJson(
        apiKey,
        buildInboxExtractionPrompt(rawText),
        INBOX_SCHEMA,
      );
      return result as ExtractionResult;
    },

    async extractSyllabusItems(
      syllabusText: string,
    ): Promise<SyllabusExtractionResult> {
      const result = await generateJson(
        apiKey,
        buildSyllabusExtractionPrompt(syllabusText),
        SYLLABUS_SCHEMA,
      );
      return result as SyllabusExtractionResult;
    },

    async extractGmailMessage(
      messageText: string,
    ): Promise<GmailExtractionResult> {
      const result = await generateJson(
        apiKey,
        buildGmailExtractionPrompt(messageText),
        GMAIL_SCHEMA,
      );
      return result as GmailExtractionResult;
    },
  };
}
