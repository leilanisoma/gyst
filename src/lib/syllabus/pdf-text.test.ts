import { describe, expect, it } from "vitest";
import { extractPdfPages, formatPagesForExtraction } from "./pdf-text";

// A hand-built minimal single-page PDF (no external fixture needed) —
// pdf.js tolerates the missing xref table and still parses the content stream.
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

describe("extractPdfPages", () => {
  it("extracts page text from a real PDF buffer", async () => {
    const pages = await extractPdfPages(MINIMAL_PDF);
    expect(pages).toEqual([{ num: 1, text: "Midterm Exam on March 5" }]);
  });
});

describe("formatPagesForExtraction", () => {
  it("joins pages with explicit page markers", () => {
    const formatted = formatPagesForExtraction([
      { num: 1, text: "Page one text" },
      { num: 2, text: "Page two text" },
    ]);
    expect(formatted).toBe("--- Page 1 ---\nPage one text\n\n--- Page 2 ---\nPage two text");
  });
});
