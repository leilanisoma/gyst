import type { AIClient } from "../client";
import type {
  ChatMessageInput,
  ChatTurnResult,
  EducationFitResult,
  ExtractionResult,
  GmailExtractionResult,
  SyllabusExtractionResult,
  ToolDeclaration,
} from "../types";
import { buildInboxExtractionPrompt } from "../prompts/inbox-extraction";
import { buildSyllabusExtractionPrompt } from "../prompts/syllabus-extraction";
import { buildGmailExtractionPrompt } from "../prompts/gmail-extraction";
import { buildEducationFitPrompt } from "../prompts/education-fit";

const BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models";
const MODEL = "gemini-2.5-flash-lite";
const EMBEDDING_MODEL = "text-embedding-004";

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

const EDUCATION_FIT_SCHEMA: GeminiSchema = {
  type: "OBJECT",
  properties: {
    requiresUnmetEducation: { type: "BOOLEAN" },
    reasoning: { type: "STRING" },
  },
  required: ["requiresUnmetEducation", "reasoning"],
};

/**
 * Tool parameter schemas are authored as standard JSON Schema (lowercase
 * `type`, matching OpenAI/Anthropic function-calling conventions) so
 * `src/lib/chat/tools/` stays provider-neutral. Gemini's own Schema type
 * wants uppercase `Type` enum values (STRING/OBJECT/ARRAY/...) — this is
 * the one place that quirk gets translated.
 */
function toGeminiSchema(schema: Record<string, unknown>): GeminiSchema {
  const result: Record<string, unknown> = { ...schema };
  if (typeof result.type === "string") {
    result.type = result.type.toUpperCase();
  }
  if (result.properties && typeof result.properties === "object") {
    result.properties = Object.fromEntries(
      Object.entries(result.properties as Record<string, unknown>).map(
        ([key, value]) => [
          key,
          toGeminiSchema(value as Record<string, unknown>),
        ],
      ),
    );
  }
  if (result.items && typeof result.items === "object") {
    result.items = toGeminiSchema(result.items as Record<string, unknown>);
  }
  return result as GeminiSchema;
}

type GeminiContent = { role: string; parts: Record<string, unknown>[] };

/**
 * Maps this app's provider-neutral chat turn history onto Gemini's content
 * array. Gemini has no explicit tool-call id, so multiple `tool` messages
 * answering the same assistant turn are folded into one `role: "function"`
 * content with one `functionResponse` part each — Gemini correlates those
 * by tool name, not by an id.
 */
function toGeminiContents(messages: ChatMessageInput[]): GeminiContent[] {
  const contents: GeminiContent[] = [];
  for (const message of messages) {
    if (message.role === "user") {
      contents.push({ role: "user", parts: [{ text: message.content }] });
    } else if (message.role === "assistant") {
      const parts: Record<string, unknown>[] = [];
      if (message.content) parts.push({ text: message.content });
      for (const call of message.toolCalls ?? []) {
        parts.push({ functionCall: { name: call.name, args: call.args } });
      }
      contents.push({ role: "model", parts });
    } else {
      const last = contents[contents.length - 1];
      const part = {
        functionResponse: {
          name: message.toolName,
          response: { content: message.content },
        },
      };
      if (last?.role === "function") {
        last.parts.push(part);
      } else {
        contents.push({ role: "function", parts: [part] });
      }
    }
  }
  return contents;
}

async function generateChat(
  apiKey: string,
  params: {
    systemInstruction: string;
    messages: ChatMessageInput[];
    tools: ToolDeclaration[];
  },
): Promise<ChatTurnResult> {
  const body: Record<string, unknown> = {
    contents: toGeminiContents(params.messages),
    systemInstruction: { parts: [{ text: params.systemInstruction }] },
  };
  if (params.tools.length > 0) {
    body.tools = [
      {
        functionDeclarations: params.tools.map((tool) => ({
          name: tool.name,
          description: tool.description,
          parameters: toGeminiSchema(tool.parameters),
        })),
      },
    ];
  }

  const response = await fetch(
    `${BASE_URL}/${MODEL}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  );

  if (!response.ok) {
    const text = await response.text();
    throw new GeminiApiError(
      `Gemini API request failed (${response.status}): ${text}`,
      response.status,
    );
  }

  const responseBody = await response.json();
  const candidate = responseBody.candidates?.[0];
  if (!candidate) {
    throw new GeminiApiError(
      "Gemini returned no candidates (likely blocked by safety filters).",
      response.status,
    );
  }

  let text = "";
  const toolCalls: ChatTurnResult["toolCalls"] = [];
  const parts: Record<string, unknown>[] = candidate.content?.parts ?? [];
  parts.forEach((part, index) => {
    if (typeof part.text === "string") {
      text += part.text;
    } else if (part.functionCall) {
      const call = part.functionCall as { name: string; args?: unknown };
      toolCalls.push({
        id: `call_${index}`,
        name: call.name,
        args: call.args ?? {},
      });
    }
  });

  const usage = responseBody.usageMetadata ?? {};
  return {
    text,
    toolCalls,
    usage: {
      inputTokens: usage.promptTokenCount ?? 0,
      outputTokens: usage.candidatesTokenCount ?? 0,
    },
  };
}

async function embedContent(apiKey: string, text: string): Promise<number[]> {
  const response = await fetch(
    `${BASE_URL}/${EMBEDDING_MODEL}:embedContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: { parts: [{ text }] } }),
    },
  );

  if (!response.ok) {
    const body = await response.text();
    throw new GeminiApiError(
      `Gemini embedding request failed (${response.status}): ${body}`,
      response.status,
    );
  }

  const body = await response.json();
  const values = body.embedding?.values;
  if (!Array.isArray(values)) {
    throw new GeminiApiError(
      "Gemini returned no embedding values.",
      response.status,
    );
  }
  return values as number[];
}

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

    async chat(params): Promise<ChatTurnResult> {
      return generateChat(apiKey, params);
    },

    async embedText(text: string): Promise<number[]> {
      return embedContent(apiKey, text);
    },

    async classifyEducationFit(
      resumeText: string,
      jobTitle: string,
      jobDescription: string | null,
    ): Promise<EducationFitResult> {
      const result = await generateJson(
        apiKey,
        buildEducationFitPrompt(resumeText, jobTitle, jobDescription),
        EDUCATION_FIT_SCHEMA,
      );
      return result as EducationFitResult;
    },
  };
}
