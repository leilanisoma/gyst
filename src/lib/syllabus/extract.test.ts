import { describe, expect, it, vi } from "vitest";
import { FakeSupabase } from "@/lib/test/fake-supabase";
import type { AIClient } from "@/ai/client";

const MINIMAL_PDF = Buffer.from(
  `%PDF-1.4
1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj
2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj
3 0 obj<</Type/Page/Parent 2 0 R/Resources<</Font<</F1 4 0 R>>>>/MediaBox[0 0 300 300]/Contents 5 0 R>>endobj
4 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj
5 0 obj<</Length 55>>
stream
BT /F1 12 Tf 10 100 Td (Midterm Exam on March 5) Tj ET
endstream
endobj
trailer<</Size 6/Root 1 0 R>>
%%EOF`,
);

let fakeClient: AIClient | null = null;
vi.mock("@/ai", () => ({ getAIClient: () => fakeClient }));

function makeDbWithStorage(downloadResult: { data: unknown; error: { message: string } | null }) {
  const db = new FakeSupabase();
  return Object.assign(db, {
    storage: { from: () => ({ download: async () => downloadResult }) },
  });
}

describe("extractSyllabusItemsFromDocument", () => {
  it("returns a clear error when no AI provider is configured (the real state today)", async () => {
    fakeClient = null;
    const { extractSyllabusItemsFromDocument } = await import("./extract");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = makeDbWithStorage({ data: null, error: null }) as any;
    const result = await extractSyllabusItemsFromDocument(db, "user-1", "doc-1");
    expect(result).toEqual({
      ok: false,
      error: "AI extraction isn't available yet — no provider is configured.",
    });
  });

  it("downloads the syllabus, extracts text, and inserts unconfirmed syllabus_items once a provider exists", async () => {
    fakeClient = {
      provider: "fake",
      chat: async () => ({ text: "", toolCalls: [], usage: { inputTokens: 0, outputTokens: 0 } }),
      embedText: async () => [],
      classifyEducationFit: async () => ({ requiresUnmetEducation: false, reasoning: "" }),
      extractInboxItem: async () => ({ items: [] }),
      extractSyllabusItems: async (text: string) => ({
        items: [
          {
            kind: "major_date",
            title: "Midterm",
            description: null,
            date: "2026-08-15",
            sourcePage: text.includes("Page 1") ? 1 : null,
            confidence: 0.8,
          },
        ],
      }),
      extractGmailMessage: async () => ({ items: [] }),
    };

    const { extractSyllabusItemsFromDocument } = await import("./extract");
    const db = makeDbWithStorage({ data: new Blob([MINIMAL_PDF]), error: null });
    db.tables.documents = [
      { id: "doc-1", user_id: "user-1", kind: "syllabus", course_id: "course-1", storage_path: "user-1/x.pdf" },
    ];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await extractSyllabusItemsFromDocument(db as any, "user-1", "doc-1");

    expect(result).toEqual({ ok: true, itemsCreated: 1 });
    expect(db.tables.syllabus_items).toHaveLength(1);
    expect(db.tables.syllabus_items![0]).toMatchObject({
      course_id: "course-1",
      document_id: "doc-1",
      kind: "major_date",
      title: "Midterm",
      confirmed: false,
      source_page: 1,
    });
  });

  it("errors when the syllabus document isn't linked to a course", async () => {
    fakeClient = {
      provider: "fake",
      chat: async () => ({ text: "", toolCalls: [], usage: { inputTokens: 0, outputTokens: 0 } }),
      embedText: async () => [],
      classifyEducationFit: async () => ({ requiresUnmetEducation: false, reasoning: "" }),
      extractInboxItem: async () => ({ items: [] }),
      extractSyllabusItems: async () => ({ items: [] }),
      extractGmailMessage: async () => ({ items: [] }),
    };
    const { extractSyllabusItemsFromDocument } = await import("./extract");
    const db = makeDbWithStorage({ data: new Blob([MINIMAL_PDF]), error: null });
    db.tables.documents = [
      { id: "doc-1", user_id: "user-1", kind: "syllabus", course_id: null, storage_path: "user-1/x.pdf" },
    ];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await extractSyllabusItemsFromDocument(db as any, "user-1", "doc-1");
    expect(result).toEqual({ ok: false, error: "Syllabus isn't linked to a course." });
  });
});
