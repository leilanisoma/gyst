import { afterEach, describe, expect, it, vi } from "vitest";
import { createDraft, getMessage, getProfile, listMessageIds } from "./client";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("getProfile", () => {
  it("returns the connected account's email address", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ emailAddress: "me@example.com" }),
      }),
    );
    await expect(getProfile("token")).resolves.toEqual({
      emailAddress: "me@example.com",
    });
  });
});

describe("listMessageIds", () => {
  it("sends the search query as `q` and paginates until maxResults", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          messages: [{ id: "1", threadId: "t1" }],
          nextPageToken: "page2",
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ messages: [{ id: "2", threadId: "t2" }] }),
      });
    vi.stubGlobal("fetch", fetchMock);

    const result = await listMessageIds("token", "label:job-search", 10);
    expect(result).toEqual([
      { id: "1", threadId: "t1" },
      { id: "2", threadId: "t2" },
    ]);
    const firstUrl = fetchMock.mock.calls[0][0] as string;
    expect(firstUrl).toContain(`q=${encodeURIComponent("label:job-search")}`);
  });

  it("throws with the status and body on a non-ok response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 403,
        text: async () => "insufficient scope",
      }),
    );
    await expect(listMessageIds("token", "q")).rejects.toThrow(/403/);
  });
});

describe("getMessage", () => {
  function base64Url(text: string) {
    return Buffer.from(text, "utf8")
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
  }

  it("parses subject/from headers and the text/plain body out of a multipart message", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          id: "msg-1",
          threadId: "thread-1",
          snippet: "Interview scheduled...",
          payload: {
            mimeType: "multipart/alternative",
            headers: [
              { name: "Subject", value: "Interview scheduled" },
              { name: "From", value: "recruiter@company.com" },
              { name: "Message-ID", value: "<abc@mail.gmail.com>" },
            ],
            parts: [
              {
                mimeType: "text/plain",
                body: { data: base64Url("Please confirm 2pm Friday.") },
              },
              {
                mimeType: "text/html",
                body: { data: base64Url("<p>Please confirm 2pm Friday.</p>") },
              },
            ],
          },
        }),
      }),
    );

    const message = await getMessage("token", "msg-1");
    expect(message).toEqual({
      id: "msg-1",
      threadId: "thread-1",
      subject: "Interview scheduled",
      from: "recruiter@company.com",
      messageIdHeader: "<abc@mail.gmail.com>",
      snippet: "Interview scheduled...",
      bodyText: "Please confirm 2pm Friday.",
    });
  });

  it("falls back to the snippet when no text/plain part exists", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          id: "msg-2",
          threadId: "thread-2",
          snippet: "fallback snippet",
          payload: { headers: [], mimeType: "text/html", body: {} },
        }),
      }),
    );

    const message = await getMessage("token", "msg-2");
    expect(message.bodyText).toBe("fallback snippet");
  });
});

describe("createDraft", () => {
  it("posts a base64url-encoded MIME reply with a Re: subject and never calls a send endpoint", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: "draft-1" }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await createDraft("token", {
      threadId: "thread-1",
      inReplyToMessageId: "msg-1",
      inReplyToHeaderMessageId: "<abc@mail.gmail.com>",
      to: "recruiter@company.com",
      subject: "Interview scheduled",
      body: "Confirming 2pm Friday works.",
    });

    expect(result).toEqual({ id: "draft-1" });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toContain("/users/me/drafts");
    expect(init.method).toBe("POST");
    const requestBody = JSON.parse(init.body);
    expect(requestBody.message.threadId).toBe("thread-1");
    const rawDecoded = Buffer.from(
      requestBody.message.raw.replace(/-/g, "+").replace(/_/g, "/"),
      "base64",
    ).toString("utf8");
    expect(rawDecoded).toContain("Subject: Re: Interview scheduled");
    expect(rawDecoded).toContain("In-Reply-To: <abc@mail.gmail.com>");
    expect(rawDecoded).toContain("Confirming 2pm Friday works.");
  });
});
