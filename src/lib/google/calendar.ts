const BASE_URL = "https://www.googleapis.com/calendar/v3";

class GoogleApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

/** Thrown when a stored syncToken is no longer valid (Google returns 410); caller must do a full resync. */
export class SyncTokenExpiredError extends Error {}

async function googleFetch(
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
    if (response.status === 410) {
      throw new SyncTokenExpiredError(body);
    }
    throw new GoogleApiError(
      `Google Calendar API ${path} failed (${response.status}): ${body}`,
      response.status,
    );
  }
  if (response.status === 204) return null;
  return response.json();
}

export type GoogleCalendarListEntry = {
  id: string;
  summary: string;
  primary?: boolean;
  accessRole: string;
  backgroundColor?: string;
};

export async function listCalendars(
  accessToken: string,
): Promise<GoogleCalendarListEntry[]> {
  const items: GoogleCalendarListEntry[] = [];
  let pageToken: string | undefined;
  do {
    const data = await googleFetch(
      accessToken,
      `/users/me/calendarList?${new URLSearchParams({
        ...(pageToken ? { pageToken } : {}),
      })}`,
    );
    items.push(...(data.items ?? []));
    pageToken = data.nextPageToken;
  } while (pageToken);
  return items;
}

export type GoogleEventResource = {
  id: string;
  status: string;
  summary?: string;
  location?: string;
  start: { date?: string; dateTime?: string; timeZone?: string };
  end: { date?: string; dateTime?: string; timeZone?: string };
  recurringEventId?: string;
};

export type ListEventsResult = {
  events: GoogleEventResource[];
  nextSyncToken: string | null;
};

/**
 * Lists events for one calendar. Pass `syncToken` for an incremental sync
 * (deleted events come back with status: "cancelled"); omit it — and pass
 * `timeMin` instead — for the initial full sync. `singleEvents: true`
 * expands recurring events into individual instances so each occurrence
 * normalizes independently (PLAN.md §3's "normalize timezone and recurrence").
 */
export async function listEvents(
  accessToken: string,
  calendarId: string,
  options: { syncToken?: string; timeMin?: string } = {},
): Promise<ListEventsResult> {
  const events: GoogleEventResource[] = [];
  let pageToken: string | undefined;
  let nextSyncToken: string | null = null;

  do {
    const params = new URLSearchParams({
      singleEvents: "true",
      maxResults: "250",
      ...(options.syncToken ? { syncToken: options.syncToken } : {}),
      ...(!options.syncToken && options.timeMin
        ? { timeMin: options.timeMin }
        : {}),
      ...(pageToken ? { pageToken } : {}),
    });
    const data = await googleFetch(
      accessToken,
      `/calendars/${encodeURIComponent(calendarId)}/events?${params}`,
    );
    events.push(...(data.items ?? []));
    pageToken = data.nextPageToken;
    if (data.nextSyncToken) nextSyncToken = data.nextSyncToken;
  } while (pageToken);

  return { events, nextSyncToken };
}

export async function createGystCalendar(
  accessToken: string,
): Promise<{ id: string }> {
  return googleFetch(accessToken, "/calendars", {
    method: "POST",
    body: JSON.stringify({ summary: "GYST" }),
  });
}

export type CreateEventInput = {
  title: string;
  startAt: string;
  endAt: string;
  timeZone: string;
  description?: string;
};

export async function insertEvent(
  accessToken: string,
  calendarId: string,
  input: CreateEventInput,
): Promise<{ id: string }> {
  return googleFetch(
    accessToken,
    `/calendars/${encodeURIComponent(calendarId)}/events`,
    {
      method: "POST",
      body: JSON.stringify({
        summary: input.title,
        description: input.description,
        start: { dateTime: input.startAt, timeZone: input.timeZone },
        end: { dateTime: input.endAt, timeZone: input.timeZone },
      }),
    },
  );
}

export async function deleteEvent(
  accessToken: string,
  calendarId: string,
  eventId: string,
): Promise<void> {
  await googleFetch(
    accessToken,
    `/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`,
    { method: "DELETE" },
  );
}
