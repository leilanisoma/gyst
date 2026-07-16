import { afterEach, describe, expect, it, vi } from "vitest";
import { createGeminiClient } from "./gemini";

afterEach(() => {
  vi.unstubAllGlobals();
});

function mockGeminiResponse(jsonText: string) {
  return vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({
      candidates: [{ content: { role: "model", parts: [{ text: jsonText }] } }],
    }),
  });
}

describe("createGeminiClient", () => {
  it("sends the API key and a JSON response schema, and parses the result", async () => {
    const fetchMock = mockGeminiResponse(
      JSON.stringify({
        items: [{ type: "task", text: "Email advisor", confidence: 0.9 }],
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const client = createGeminiClient("test-key");
    const result = await client.extractInboxItem("email advisor about thesis");

    expect(result).toEqual({
      items: [{ type: "task", text: "Email advisor", confidence: 0.9 }],
    });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toContain("key=test-key");
    expect(url).toContain("gemini-2.5-flash-lite:generateContent");
    const body = JSON.parse(init.body);
    expect(body.generationConfig.responseMimeType).toBe("application/json");
    expect(body.generationConfig.responseSchema.type).toBe("OBJECT");
    expect(body.contents[0].parts[0].text).toContain(
      "email advisor about thesis",
    );
  });

  it("throws when the API responds with a non-OK status", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 429,
        text: async () => "rate limited",
      }),
    );

    const client = createGeminiClient("test-key");
    await expect(client.extractInboxItem("text")).rejects.toThrow(
      /Gemini API request failed \(429\)/,
    );
  });

  it("throws when the response has no text content", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ candidates: [] }),
      }),
    );

    const client = createGeminiClient("test-key");
    await expect(client.extractInboxItem("text")).rejects.toThrow(
      /no text content/,
    );
  });

  it("extracts syllabus items with the syllabus schema", async () => {
    const fetchMock = mockGeminiResponse(
      JSON.stringify({
        items: [
          {
            kind: "major_date",
            title: "Midterm",
            description: null,
            date: "2026-10-01",
            sourcePage: 2,
            confidence: 0.8,
          },
        ],
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const client = createGeminiClient("test-key");
    const result = await client.extractSyllabusItems(
      "--- Page 2 ---\nMidterm on Oct 1",
    );

    expect(result).toEqual({
      items: [
        {
          kind: "major_date",
          title: "Midterm",
          description: null,
          date: "2026-10-01",
          sourcePage: 2,
          confidence: 0.8,
        },
      ],
    });
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.generationConfig.responseSchema.properties.items.items.required).toContain(
      "sourcePage",
    );
  });

  it("extracts gmail items with the gmail schema", async () => {
    const fetchMock = mockGeminiResponse(
      JSON.stringify({
        items: [
          {
            kind: "interview",
            title: "Interview scheduled",
            excerpt: "Interview on Friday at 2pm.",
            date: "2026-08-01",
            requestedAction: "Confirm availability",
            confidence: 0.95,
          },
        ],
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const client = createGeminiClient("test-key");
    const result = await client.extractGmailMessage(
      "Subject: Interview\nFrom: recruiter@co.com\n\nInterview on Friday at 2pm.",
    );

    expect(result.items[0].kind).toBe("interview");
    expect(result.items[0].requestedAction).toBe("Confirm availability");
  });
});
