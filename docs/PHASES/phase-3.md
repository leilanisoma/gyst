# Phase 3 — Google Calendar and notifications

Goal: stop duplicating schedule information. Source: `PLAN.md` §15, §6, §8.

## Checklist

- [x] Configure Google OAuth with read-only Calendar scopes.
- [x] Sync events incrementally; normalize timezone and recurrence.
- [x] Map class and fencing calendars as fixed commitments.
- [x] Add sync status, manual refresh, reconnect, and error logs.
- [x] Request write scope only when enabling approved time blocks.
- [x] Write only to a dedicated GYST calendar.
- [x] Add undo for created blocks.
- [x] Add notification center, quiet hours, and PWA web push.

## Notes

- **OAuth is fetch-based, not the `googleapis` SDK.** `src/lib/google/oauth.ts` and `calendar.ts` call Google's REST/token endpoints directly with `fetch`, matching the codebase's existing preference for minimal dependencies (only `web-push` was added, for VAPID-signed push — hand-rolling that protocol's crypto/JWT signing wasn't worth it).
- **Scopes are the narrowest available for each capability**, per CLAUDE.md's security boundaries: `calendar.readonly` for sync, and `calendar.app.created` — not the broader `calendar.events` — for write-back. `calendar.app.created` only grants access to calendars/events the app itself created, so "write only to a dedicated GYST calendar" is enforced at the OAuth scope level, not just in application logic. Write scope is requested as a separate incremental-auth step (`/api/google/connect?scope=write`), never bundled into the initial connect.
- **Tokens are encrypted at rest** (`src/lib/crypto.ts`, AES-256-GCM, `ENCRYPTION_KEY` env var) and only ever read/written from server code (`src/lib/google/tokens.ts`); `oauth_tokens` RLS scopes by owner as defense in depth, but the real boundary is that no client code path touches this table.
- **Per-calendar sync cursors live in `integrations.settings.sync_tokens` (jsonb), not `sync_runs.sync_token`** as PLAN.md §6 suggests. Google issues one syncToken per calendar, not per provider account, and this app syncs every calendar in the account (not just the ones marked as fixed commitments) so the Today timeline reflects everything, not just class/fencing. `sync_runs` ended up as a pure audit log (start/end, aggregate counts, error) rather than the cursor's home.
- **Fixed-commitment mapping is a calendar-level setting, not an event-level one.** Settings lets you check which Google calendars (e.g. "Stanford Classes", "Fencing") feed the scheduler as fixed commitments; every event synced from a checked calendar gets `events.is_fixed_commitment = true` and is merged with `recurring_schedules` in `buildFreeIntervals` (`src/app/(app)/actions.ts`). Unchecked calendars still sync and show on the Today timeline, just as informational (`kind: 'flexible'`) rather than schedule-blocking.
- **A 410 (expired syncToken) triggers a full resync from "now," not from the calendar's start.** Past events aren't relevant to scheduling or the Today timeline, so there's no need to backfill them; this also means old local rows for events before "now" at resync time become stale but harmless — they're never deleted, just no longer refreshed.
- **Approved-block write-back happens synchronously inside `updateTimeBlockSuggestionStatus`'s accept path**, not a background job — accepting the suggestion *is* the approval PLAN.md §3/§8 require, so writing right then satisfies "request write scope only when enabling approved time blocks" without inventing a separate approval step. It's best-effort: a failed write (no write scope, no network) never blocks the local accept.
- **`notifications` and `push_subscriptions` aren't in PLAN.md §6's data model** — they're pragmatic additions the same way `xp_events` was in Phase 2 (see `docs/PHASES/phase-2.md`). Quiet hours reuse the `notification_rules` jsonb column `preferences` already had reserved for exactly this (Phase 1's migration comment named it up front).
- **The only thing that currently sends a notification is a Google sync/connect error** (`markGoogleError` in `src/lib/google/integration.ts`), wired for "connector failures are visible within one sync cycle" (PLAN.md §20). There's no scheduled job yet to generate deadline/block reminders — that's real infrastructure (Supabase Cron/Edge Functions, per PLAN.md §4) that doesn't exist until a later phase needs it elsewhere too; building it just for this would be premature.
- **Quiet hours compare local wall-clock minutes-of-day as plain numbers**, not `Date` instants (`src/lib/quiet-hours.ts`) — sidesteps DST/date-boundary edge cases entirely for an overnight window like 22:00–07:00, at the cost of not handling the (irrelevant here) case of a quiet window that spans more than 24 hours.
- **Push send is best-effort and self-healing**: a 404/410 from the push service means the subscription is gone, so `src/lib/notifications.ts` deletes it from `push_subscriptions` right there rather than surfacing an error anywhere.

## Exit criteria

> Calendar imports reliably for one week, no duplicates appear, and approved blocks round-trip correctly.
>
> Verified so far: read scope OAuth, incremental sync with 410-fallback, normalization, and write-back/undo are implemented and unit-tested where the logic is deterministic (`normalize.test.ts`, `timeline.test.ts`, `quiet-hours.test.ts`, `crypto.test.ts`). The live end-to-end OAuth round-trip against a real Google account still needs manual verification once `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` are created in Google Cloud Console — that couldn't happen in this session (no Google Cloud access), and "reliably for one week" is inherently a real-usage observation, not something a single session can certify.
