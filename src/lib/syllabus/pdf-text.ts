export type SyllabusPage = { num: number; text: string };

/**
 * Extracts per-page plain text from a syllabus PDF buffer. Deterministic
 * parsing — not an AI call.
 *
 * `pdf-parse` is imported dynamically (not at module top-level) so it stays
 * out of the static import graph of every module that merely imports this
 * file — `document-index.ts` and `job-sources/resume-fit.ts` are reachable
 * from render trees (Recruiting/School pages referencing their server
 * actions) that never actually call this function. A static top-level
 * import forces Next's bundler to resolve the `serverExternalPackages`
 * entry for `pdf-parse` in every one of those unrelated routes' server
 * bundles too — on Vercel this surfaced as an unrelated action (marking
 * notifications read) failing with "Failed to load external module
 * pdf-parse-<hash>" simply because the current page's bundle happened to
 * reference a syllabus/document action that transitively imported this
 * file. Deferring the import to call time keeps `pdf-parse` resolution
 * scoped to whichever action actually invokes PDF extraction.
 */
export async function extractPdfPages(buffer: Buffer): Promise<SyllabusPage[]> {
  const { PDFParse } = await import("pdf-parse");
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
