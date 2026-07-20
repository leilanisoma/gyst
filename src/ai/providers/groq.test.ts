import { afterEach, describe, expect, it, vi } from "vitest";
import { createGroqClient } from "./groq";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("createGroqClient", () => {
  it("sends the API key and parses the JSON message content", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: JSON.stringify({
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
            },
          },
        ],
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const client = createGroqClient("test-key");
    const result = await client.extractGmailMessage(
      "Subject: Interview\nFrom: recruiter@co.com\n\nInterview on Friday at 2pm.",
    );

    expect(result.items[0].kind).toBe("interview");
    expect(result.items[0].requestedAction).toBe("Confirm availability");

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.groq.com/openai/v1/chat/completions");
    expect(init.headers.Authorization).toBe("Bearer test-key");
    const body = JSON.parse(init.body);
    expect(body.model).toBe("openai/gpt-oss-120b");
    expect(body.response_format).toEqual({ type: "json_object" });
    expect(body.messages[0].content).toContain(
      "Interview on Friday at 2pm.",
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

    const client = createGroqClient("test-key");
    await expect(client.extractGmailMessage("text")).rejects.toThrow(
      /Groq API request failed \(429\)/,
    );
  });

  it("throws when the response has no message content", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ choices: [] }),
      }),
    );

    const client = createGroqClient("test-key");
    await expect(client.extractGmailMessage("text")).rejects.toThrow(
      /no message content/,
    );
  });

  it("throws for methods outside its Gmail-extraction scope", async () => {
    const client = createGroqClient("test-key");
    await expect(client.extractInboxItem("text")).rejects.toThrow(
      /only supports Gmail extraction/,
    );
    await expect(client.extractSyllabusItems("text")).rejects.toThrow(
      /only supports Gmail extraction/,
    );
    await expect(
      client.chat({ systemInstruction: "s", messages: [], tools: [] }),
    ).rejects.toThrow(/only supports Gmail extraction/);
    await expect(client.embedText("text")).rejects.toThrow(
      /only supports Gmail extraction/,
    );
  });
});
