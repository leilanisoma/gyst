const BASE_URL = "https://gmail.googleapis.com/gmail/v1";

class GmailApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

async function gmailFetch(
  accessToken: string,
  path: string,
  init?: RequestInit,
) {
  const response = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      ...init?.headers,
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  });
  if (!response.ok) {
    const body = await response.text();
    throw new GmailApiError(
      `Gmail API ${path} failed (${response.status}): ${body}`,
      response.status,
    );
  }
  return response.json();
}

function base64UrlDecode(data: string): string {
  return Buffer.from(
    data.replace(/-/g, "+").replace(/_/g, "/"),
    "base64",
  ).toString("utf8");
}

function base64UrlEncode(data: string): string {
  return Buffer.from(data, "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export async function getProfile(
  accessToken: string,
): Promise<{ emailAddress: string }> {
  return gmailFetch(accessToken, "/users/me/profile");
}

export type GmailMessageRef = { id: string; threadId: string };

/**
 * Lists message IDs matching a Gmail search query (task 7.3 — this app never
 * lists/reads the whole inbox, only whatever the user scopes it to via
 * `q`, e.g. a label search like `label:job-search`).
 */
export async function listMessageIds(
  accessToken: string,
  query: string,
  maxResults = 50,
): Promise<GmailMessageRef[]> {
  const messages: GmailMessageRef[] = [];
  let pageToken: string | undefined;
  do {
    const params = new URLSearchParams({
      q: query,
      maxResults: String(Math.min(maxResults - messages.length, 100)),
      ...(pageToken ? { pageToken } : {}),
    });
    const data = await gmailFetch(
      accessToken,
      `/users/me/messages?${params}`,
    );
    for (const item of data.messages ?? []) {
      messages.push({ id: item.id, threadId: item.threadId });
    }
    pageToken = data.nextPageToken;
  } while (pageToken && messages.length < maxResults);
  return messages;
}

type GmailApiHeader = { name: string; value: string };
type GmailApiPart = {
  mimeType?: string;
  headers?: GmailApiHeader[];
  body?: { data?: string; size?: number };
  parts?: GmailApiPart[];
};

function findHeader(headers: GmailApiHeader[] | undefined, name: string): string {
  return (
    headers?.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value ?? ""
  );
}

/** Walks multipart payloads depth-first for the first text/plain part. */
function findPlainTextBody(part: GmailApiPart | undefined): string {
  if (!part) return "";
  if (part.mimeType === "text/plain" && part.body?.data) {
    return base64UrlDecode(part.body.data);
  }
  for (const child of part.parts ?? []) {
    const found = findPlainTextBody(child);
    if (found) return found;
  }
  if (!part.parts && part.body?.data && part.mimeType?.startsWith("text/")) {
    return base64UrlDecode(part.body.data);
  }
  return "";
}

export type GmailMessageContent = {
  id: string;
  threadId: string;
  subject: string;
  from: string;
  /** RFC 2822 `Message-ID` header — distinct from Gmail's own `id` — needed for In-Reply-To/References when drafting a reply (task 7.7). */
  messageIdHeader: string;
  snippet: string;
  bodyText: string;
};

/**
 * Fetches one message in full. Only ever called for messages the sync's
 * search query already scoped to (task 7.3) — never a blind full-mailbox
 * read. Callers must not persist `bodyText`/full headers to storage (task
 * 7.8's "no full mailbox storage") — only the AI-extracted summary is kept.
 */
export async function getMessage(
  accessToken: string,
  messageId: string,
): Promise<GmailMessageContent> {
  const data = await gmailFetch(
    accessToken,
    `/users/me/messages/${encodeURIComponent(messageId)}?format=full`,
  );
  const payload = data.payload as GmailApiPart | undefined;
  return {
    id: data.id,
    threadId: data.threadId,
    subject: findHeader(payload?.headers, "Subject"),
    from: findHeader(payload?.headers, "From"),
    messageIdHeader: findHeader(payload?.headers, "Message-ID"),
    snippet: data.snippet ?? "",
    bodyText: findPlainTextBody(payload) || (data.snippet ?? ""),
  };
}

export type CreateDraftInput = {
  threadId: string;
  inReplyToMessageId: string;
  /** RFC 2822 Message-ID header value of the message being replied to (for In-Reply-To/References — distinct from Gmail's own `id`). */
  inReplyToHeaderMessageId: string;
  to: string;
  subject: string;
  body: string;
};

/**
 * Creates a draft reply in the user's real Gmail drafts folder — never
 * calls a send endpoint (task 7.7's "draft-only"). The user must open
 * Gmail themselves and click Send.
 */
export async function createDraft(
  accessToken: string,
  input: CreateDraftInput,
): Promise<{ id: string }> {
  const subject = input.subject.toLowerCase().startsWith("re:")
    ? input.subject
    : `Re: ${input.subject}`;
  const raw = [
    `To: ${input.to}`,
    `Subject: ${subject}`,
    `In-Reply-To: ${input.inReplyToHeaderMessageId}`,
    `References: ${input.inReplyToHeaderMessageId}`,
    `Content-Type: text/plain; charset="UTF-8"`,
    "",
    input.body,
  ].join("\r\n");

  const data = await gmailFetch(accessToken, "/users/me/drafts", {
    method: "POST",
    body: JSON.stringify({
      message: {
        threadId: input.threadId,
        raw: base64UrlEncode(raw),
      },
    }),
  });
  return { id: data.id };
}
