import { describe, expect, it, vi } from "vitest";
import { FakeSupabase } from "@/lib/test/fake-supabase";
import type { AIClient } from "@/ai/client";
import { indexDocumentForSearch } from "./document-index";

function makeDbWithStorage(downloadResult: {
  data: unknown;
  error: { message: string } | null;
}) {
  const db = new FakeSupabase();
  return Object.assign(db, {
    storage: { from: () => ({ download: async () => downloadResult }) },
  });
}

function fakeClient(embed: (text: string) => Promise<number[]>): AIClient {
  return {
    provider: "fake",
    extractInboxItem: async () => ({ items: [] }),
    extractSyllabusItems: async () => ({ items: [] }),
    extractGmailMessage: async () => ({ items: [] }),
    chat: async () => ({
      text: "",
      toolCalls: [],
      usage: { inputTokens: 0, outputTokens: 0 },
    }),
    embedText: embed,
    classifyEducationFit: async () => ({ requiresUnmetEducation: false, reasoning: "" }),
  };
}

describe("indexDocumentForSearch", () => {
  it("chunks a plain-text document and embeds each new chunk", async () => {
    const embedSpy = vi.fn(async (text: string) => [text.length, 0.5]);
    const db = makeDbWithStorage({
      data: new Blob([Buffer.from("First paragraph.\n\nSecond paragraph.")]),
      error: null,
    });
    db.tables.documents = [
      {
        id: "doc-1",
        user_id: "user-1",
        storage_path: "user-1/notes.txt",
        mime_type: "text/plain",
      },
    ];

    const result = await indexDocumentForSearch(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      db as any,
      fakeClient(embedSpy),
      "user-1",
      "doc-1",
    );

    expect(result.ok).toBe(true);
    expect(embedSpy).toHaveBeenCalledTimes(1);
    expect(db.tables.document_chunks).toHaveLength(1);
    expect(db.tables.document_chunks![0]).toMatchObject({
      document_id: "doc-1",
      user_id: "user-1",
      content: "First paragraph.\n\nSecond paragraph.",
      page: null,
    });
  });

  it("reuses an unchanged chunk's embedding instead of re-embedding it", async () => {
    const embedSpy = vi.fn(async () => [1, 2, 3]);
    const db = makeDbWithStorage({
      data: new Blob([Buffer.from("Same content every time.")]),
      error: null,
    });
    db.tables.documents = [
      {
        id: "doc-1",
        user_id: "user-1",
        storage_path: "user-1/notes.txt",
        mime_type: "text/plain",
      },
    ];

    const client = fakeClient(embedSpy);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await indexDocumentForSearch(db as any, client, "user-1", "doc-1");
    expect(embedSpy).toHaveBeenCalledTimes(1);

    const second = await indexDocumentForSearch(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      db as any,
      client,
      "user-1",
      "doc-1",
    );
    expect(embedSpy).toHaveBeenCalledTimes(1); // still 1 — no re-embed on the second run
    expect(second).toEqual({ ok: true, chunksIndexed: 1, chunksReused: 1 });
  });

  it("returns an error when the document isn't found", async () => {
    const db = makeDbWithStorage({ data: null, error: null });
    const result = await indexDocumentForSearch(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      db as any,
      fakeClient(async () => []),
      "user-1",
      "missing",
    );
    expect(result).toEqual({ ok: false, error: "Document not found." });
  });
});
