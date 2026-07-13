import { PDFParse } from "pdf-parse";

export type SyllabusPage = { num: number; text: string };

/** Extracts per-page plain text from a syllabus PDF buffer. Deterministic parsing — not an AI call. */
export async function extractPdfPages(buffer: Buffer): Promise<SyllabusPage[]> {
  const parser = new PDFParse({ data: buffer });
  try {
    const result = await parser.getText();
    return result.pages.map((page) => ({ num: page.num, text: page.text }));
  } finally {
    await parser.destroy();
  }
}

/** Joins pages with explicit page markers so a downstream AI extraction call can report which page an item came from. */
export function formatPagesForExtraction(pages: SyllabusPage[]): string {
  return pages.map((page) => `--- Page ${page.num} ---\n${page.text}`).join("\n\n");
}
