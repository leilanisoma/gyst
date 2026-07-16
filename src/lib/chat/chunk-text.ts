export type TextChunk = { content: string; page: number | null };

const MAX_CHUNK_CHARS = 1200;
const OVERLAP_CHARS = 150;

/**
 * Splits text into overlapping chunks for embedding, preferring to break on
 * paragraph boundaries. Deterministic — not an AI call (CLAUDE.md
 * "deterministic logic never lives behind a prompt").
 */
export function chunkText(
  text: string,
  page: number | null = null,
): TextChunk[] {
  const normalized = text.replace(/\r\n/g, "\n").trim();
  if (!normalized) return [];

  const chunks: TextChunk[] = [];
  let start = 0;
  while (start < normalized.length) {
    let end = Math.min(start + MAX_CHUNK_CHARS, normalized.length);
    if (end < normalized.length) {
      const paragraphBreak = normalized.lastIndexOf("\n\n", end);
      if (paragraphBreak > start + MAX_CHUNK_CHARS / 2) {
        end = paragraphBreak;
      }
    }
    const content = normalized.slice(start, end).trim();
    if (content) chunks.push({ content, page });
    if (end >= normalized.length) break;
    start = Math.max(end - OVERLAP_CHARS, start + 1);
  }
  return chunks;
}

/** Chunks each page independently so every chunk keeps a single accurate page number for citations. */
export function chunkPages(
  pages: { num: number; text: string }[],
): TextChunk[] {
  return pages.flatMap((page) => chunkText(page.text, page.num));
}
