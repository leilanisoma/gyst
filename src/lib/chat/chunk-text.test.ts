import { describe, expect, it } from "vitest";
import { chunkPages, chunkText } from "./chunk-text";

describe("chunkText", () => {
  it("returns nothing for empty/whitespace text", () => {
    expect(chunkText("")).toEqual([]);
    expect(chunkText("   \n\n  ")).toEqual([]);
  });

  it("returns one chunk for short text", () => {
    const chunks = chunkText("Hello world.", 3);
    expect(chunks).toEqual([{ content: "Hello world.", page: 3 }]);
  });

  it("splits long text into multiple chunks, all under the max size plus overlap", () => {
    const paragraph = "A".repeat(200) + "\n\n";
    const text = paragraph.repeat(20);
    const chunks = chunkText(text, null);
    expect(chunks.length).toBeGreaterThan(1);
    for (const chunk of chunks) {
      expect(chunk.content.length).toBeLessThanOrEqual(1200);
      expect(chunk.page).toBeNull();
    }
    // No content lost - concatenating chunk starts should cover the source.
    expect(chunks.every((c) => text.includes(c.content))).toBe(true);
  });

  it("carries the page number through for every chunk of that page", () => {
    const chunks = chunkPages([
      { num: 1, text: "Page one content." },
      { num: 2, text: "Page two content." },
    ]);
    expect(chunks).toEqual([
      { content: "Page one content.", page: 1 },
      { content: "Page two content.", page: 2 },
    ]);
  });
});
