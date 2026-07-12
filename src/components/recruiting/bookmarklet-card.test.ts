import { describe, expect, it } from "vitest";
import { buildBookmarkletHref } from "./bookmarklet-card";

describe("buildBookmarkletHref", () => {
  it("produces a javascript: URI that opens the capture page on the configured app URL", () => {
    const href = buildBookmarkletHref("https://gyst.example.com");

    expect(href.startsWith("javascript:")).toBe(true);
    expect(href).toContain('"https://gyst.example.com" + "/recruiting/capture');
    expect(href).toContain("encodeURIComponent(location.href)");
    expect(href).toContain("encodeURIComponent(document.title");
  });
});
