# Phase 7 — Gmail-assisted automation

Goal: detect actionable recruiting and school messages without copying an
entire inbox. Source: `PLAN.md` §15 Phase 7, §8, §12.

## Checklist (task IDs map 1:1 to PLAN.md §15 Phase 7 bullets)

- [x] 7.1 Confirm whether Gmail and Google Calendar live on the same Google account; extend the `integrations`/`oauth_tokens` schema so Gmail can be a separate connection if not.
- [x] 7.2 Configure Gmail OAuth and narrow read scopes.
- [x] 7.3 Begin with user-created Gmail labels or strict searches.
- [x] 7.4 Extract interview dates, application confirmations, deadlines, and requested actions.
- [x] 7.5 Show every extracted item in a review queue.
- [x] 7.6 Link back to the original Gmail message.
- [x] 7.7 Add draft-only replies and follow-ups.
- [x] 7.8 Add retention controls for message excerpts.

## Exit criteria

> Tested messages produce correct suggestions, no email is sent, and
> irrelevant personal mail is not stored.
>
> Architecturally satisfied, not empirically proven against a real Gmail
> account — the same caveat every phase with a browser-based OAuth consent
> flow has flagged (Phase 3/4/5/6). What's built: extraction only ever runs
> against messages matching a user-configured search query/label (never the
> whole inbox, satisfying "irrelevant personal mail is not stored" by
> construction — there's no default query, so an unconfigured connection
> scans nothing); this app's code never calls a Gmail send endpoint anywhere
> (grep for `/send` in `src/lib/gmail/client.ts` — it doesn't exist), only
> `drafts.create`, satisfying "no email is sent"; "tested messages produce
> correct suggestions" is covered by `client.test.ts`/`sync.test.ts`/
> `extract.test.ts` against mocked Gmail API responses and a fake AI client,
> not a live account, since no real OAuth consent flow can be completed in
> this sandbox (no browser session) and no AI provider is configured yet
> (Phase 0 left that undecided) to produce real extractions either way. What
> that leaves outstanding: nobody has clicked through the actual Google
> consent screen for a real Gmail account yet, so the OAuth
> connect/callback routes and the live `getMessage`/`createDraft` calls are
> unverified beyond `tsc`/`eslint` and the mocked unit tests — same gap
> Phase 6 flagged for Canvas before its personal-access-token check (6.1)
> confirmed real access, except here there's no equivalent "run it once
> against the real account" step available without an interactive OAuth
> flow.

## Notes

### 7.1 notes

- **Confirmed with the user: Gmail and Google Calendar are different Google accounts.** This rules out the "same account, just request an extra scope on the existing connection" option — Gmail needs its own OAuth connection, tokens, and account identity, exactly the case PLAN.md's task text flagged.
- **Fix is a new `provider = 'gmail'` value, not a change to `unique (user_id, provider)`.** The existing constraint already scopes one row per `(user_id, provider)` — Calendar's row is `provider = 'google'`; giving Gmail its own distinct provider string means it gets its own row (own `account_email`, `granted_scopes`, tokens, sync cursor) with zero collision, no constraint shape change needed. This is the same pattern Phase 6 used to add `'canvas'` alongside `'google'` (`20260712110001_school_schema.sql`), just applied to a second Google product instead of a second vendor.
- **Migration**: `supabase/migrations/20260714000001_gmail_provider.sql` widens the `provider` check constraints on `integrations`, `oauth_tokens`, and `sync_runs` to include `'gmail'` (mirroring the exact drop/add-constraint pattern Phase 6 used). No other schema change — `account_email`, `settings`, `granted_scopes`, and the token columns are all already generic enough to hold a second, independent Google connection as-is.
- **No code changes yet** — `src/lib/google/{integration,tokens}.ts` still hardcode `PROVIDER = "google"` for Calendar; a parallel Gmail module (own `PROVIDER = "gmail"` constant, own connect/callback routes, own scopes) is 7.2's job, not this one. `GOOGLE_CLIENT_ID`/`SECRET`/`REDIRECT_URI` can be reused unchanged for Gmail's OAuth flow — one registered OAuth app can authenticate multiple different Google accounts, since the account is chosen by whoever completes the consent screen, not by the client credentials.
- **Live-applied to the remote Supabase project** (`iygdvkgvjtiiyyfqlnfo`) via `supabase db push` — this sandbox only had `NEXT_PUBLIC_SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY` by default (enough for data reads/writes via `@supabase/supabase-js`, not enough for the CLI to push DDL), so the user supplied a `SUPABASE_ACCESS_TOKEN` for this one command; it was used only as an inline env var for the push and never written to a file or committed. `supabase migration list` confirms `20260714000001` now shows the same value on both `local` and `remote`.
- **`docs/ARCHITECTURE.md`/`docs/DATA_MODEL.md` updated** to reflect `gmail` as an allowed provider value; both had already anticipated this exact task ahead of time.

### 7.2 notes

- **`src/lib/gmail/{oauth,integration,tokens}.ts` mirror `src/lib/google/{oauth,integration,tokens}.ts` almost line-for-line**, with `PROVIDER = "gmail"` in place of `"google"` — same precedent as Canvas's connector modules mirroring Google's shape. `GmailIntegrationSettings` holds `search_query` (task 7.3) and `retention_days` (task 7.8) instead of Calendar's `fixed_calendar_ids`/`gyst_calendar_id`/`sync_tokens`.
- **Gmail uses a fully separate registered OAuth client from Calendar's — not just a different redirect URI on the same client.** The real Google Cloud client the user set up turned out to have its own distinct client ID/secret, not a shared app with a second account, which is what an earlier version of this task assumed (that draft briefly gave `google/oauth.ts`'s token-exchange functions an optional `redirectUri` override so Gmail could reuse them; it was reverted once the real credentials arrived). `src/lib/gmail/oauth.ts` is self-contained instead — its own `buildGmailAuthUrl`/`exchangeGmailCodeForTokens`/`refreshGmailAccessToken` against new `GMAIL_CLIENT_ID`/`GMAIL_CLIENT_SECRET`/`GMAIL_REDIRECT_URI` env vars — rather than depending on Calendar's `GOOGLE_*` env being configured at all.
- **Caught a real credential mix-up before it caused damage**: the user's first pasted "new" client ID was byte-for-byte identical to the existing Calendar `GOOGLE_CLIENT_ID` (only the secret differed — turned out to be a copy-paste error, not an intentional second secret on the same client), and the first redirect URI they gave was Calendar's own `/api/google/callback` path rather than a Gmail-specific one. Using either as given would have made Gmail's OAuth flow silently overwrite Calendar's `oauth_tokens`/`integrations` row (same `provider` value under the wrong assumption, or the *same* route handler receiving Gmail's auth code). Flagged both before writing anything; the user corrected the client ID and confirmed the dedicated `/api/gmail/callback` redirect.
- **Real credentials are in `.env.local` (gitignored, never committed)**; `.env.example` documents the two new required vars. Verified by starting the local dev server and confirming `/api/gmail/connect` behaves identically to `/api/google/connect` (redirects to `/login` when unauthenticated, no env-parsing crash) — this is real verification of the env/route wiring, though still short of clicking through an actual Google consent screen.
- **Scopes**: `gmail.readonly` by default, `gmail.compose` requested incrementally only via `/api/gmail/connect?scope=compose` — identical "off by default, explicit opt-in link" pattern as Calendar's `calendar.app.created` write scope (Phase 3). Google's `gmail.compose` scope also technically permits sending; task 7.7's "draft-only" guarantee is enforced by this app's code never calling a send endpoint (verified in `client.ts` — only `drafts.create` exists), the same "app-level guarantee layered under an API-level scope" pattern Calendar's write-back already relies on.
- **`/api/gmail/connect` and `/api/gmail/callback` mirror the Google routes' shape**, with their own `gm_oauth_state` cookie (distinct name from Calendar's `g_oauth_state` — two independent OAuth flows, can't share a state cookie) and `getProfile()` (Gmail API `users.getProfile`) in place of `listCalendars().find(primary)` for capturing `account_email`.
- **Settings UI** (`GmailIntegrationCard`) mirrors `GoogleIntegrationCard`'s connect/sync/reconnect/disconnect layout, with the search-query and retention inputs (7.3/7.8) and the compose-scope opt-in link (7.7) added as their own bordered sections, same visual pattern as Calendar's fixed-calendar-checkboxes/write-back sections.
- **Not yet live-verified through an actual completed OAuth consent screen** — that needs an interactive browser session this sandbox doesn't have, the same limitation Phase 4/5/6 flagged for their own auth flows. Verified via `tsc`/`eslint`, the full mocked-`fetch` unit test suite, and the live local-server check above.

### 7.3 notes

- **No default search query — sync refuses to run with none configured.** `runGmailSync` (`src/lib/gmail/sync.ts`) checks `integration.settings.search_query` before calling the Gmail API at all and returns a clear error if it's unset. This is what makes "begin with user-created labels or strict searches" true by construction rather than by convention — there's no fallback that would ever read the whole inbox.
- **The query is a raw Gmail search string** (e.g. `label:job-search`, `from:recruiting@school.edu OR label:interviews`), not a structured label picker — Gmail's own search syntax already supports label/sender/subject filters, and building a picker UI over the Gmail Labels API would be a second way to express the same thing PLAN.md's task text offers as alternatives ("labels *or* strict searches"). Revisit only if a raw query proves too fiddly in practice.
- **`listMessageIds`/`getMessage` (`src/lib/gmail/client.ts`) never take a query-less path** — there's no "list everything" function in this client at all, so even a future bug in `runGmailSync` couldn't accidentally trigger a full-mailbox scan; the capability doesn't exist below the sync layer either.
- Configured from the same `GmailIntegrationCard` Settings section as 7.2 (`search_query` input + Save, calling `setGmailSearchQuery`).

### 7.4 notes

- **`AIClient` gained `extractGmailMessage(messageText)`** (`src/ai/client.ts`), alongside `extractInboxItem`/`extractSyllabusItems`, with `GmailItemCandidateSchema`/`GmailExtractionResultSchema` in `src/ai/types.ts` (kind, title, excerpt, date, requestedAction, confidence) — same shape convention as `SyllabusItemCandidateSchema`. `messageText` is one message's `Subject`/`From`/body text, never a whole thread or mailbox dump.
- **`extractGmailItemsFromMessage` (`src/lib/gmail/extract.ts`) is gated exactly like syllabus extraction** (`src/lib/syllabus/extract.ts`): `getAIClient() === null` short-circuits to the same "no provider is configured" error before touching the Gmail API or the DB. `getAIClient()` still returns `null` (Phase 0's provider decision hasn't landed), so this is a fully-wired but currently-inert framework — real extraction activates automatically once a provider exists, no further plumbing needed, identical precedent to 6.6.
- **Only the AI's own short `excerpt` is ever persisted, and only encrypted** (AES-256-GCM via the existing `src/lib/crypto.ts`, the same helper `oauth_tokens` uses) — the message's full body/headers fetched by `getMessage` are never written to Supabase. This is what satisfies task 7.8's "no full mailbox storage" at the extraction layer, not just at the retention layer.
- **Tested with a fake `AIClient` injected via `vi.mock("@/ai")`** (`extract.test.ts`), mirroring `syllabus/extract.test.ts`'s pattern exactly: no-provider error case, successful insert with encrypted excerpt + retention-based `expires_at`, and zero-candidates case.

### 7.5 / 7.6 notes

- **New `/gmail` page and nav item**, not folded into the existing `/inbox` (manual quick-capture, different status model) or into `/recruiting`/`/school` (an extracted item isn't yet known to belong to either domain) — same reasoning Canvas's assessment candidates and syllabus items got their own review surfaces inside `/school` rather than being written straight into `applications`/`tasks`. Promoting a confirmed `gmail_items` row into a real recruiting/school record doesn't exist yet — deliberately deferred, same "confirm now, promote later" gap 6.6's notes already flagged for `syllabus_items`, since building that cross-linking now (which application? which course?) would be speculative without live extractions to observe.
- **Every unconfirmed, non-dismissed `gmail_items` row shows** (`GmailReviewQueue`, `src/components/gmail/gmail-review-queue.tsx`) — no pagination/limit, since a narrow search-scoped sync (7.3) plus 30-day retention (7.8) keeps the real queue small by construction.
- **"Link back to the original Gmail message" (7.6) links the *thread*, not the message**, via `https://mail.google.com/mail/u/0/#all/<threadId>` — `#all/` works regardless of which label/folder the thread currently lives in (unlike `#inbox/`, which breaks for archived/labeled-out threads), and a reply lives in the same thread as the original message anyway.
- **Confirm/dismiss (`src/app/(app)/gmail/actions.ts`) use the same sticky-dismiss pattern as 6.4** (`dismissed_at`, never resurrected) — but unlike Canvas, there's no re-sync risk of resurrecting a dismissed item by identity, since `gmail_processed_messages` already guarantees a given message is only ever extracted from once regardless of dismiss state.

### 7.7 notes

- **Two-step explicit-approval flow, matching PLAN.md's "must never send messages... without explicit approval" architecture rule**: `draftGmailReply` only ever writes a `gmail_drafts` row (`status: "proposed"`) — nothing reaches the real Gmail account. A separate `pushGmailDraft` action is the only thing that calls the Gmail API's `drafts.create`, and it requires the user to have explicitly granted the incremental `gmail.compose` scope first (7.2). Even after pushing, the draft only exists in the user's real Gmail drafts folder — this app's code has no path to a send endpoint at all (not gated, structurally absent from `client.ts`), so the user must always open Gmail and click Send themselves.
- **Draft content is written manually, not AI-generated** — there's no `draftGmailReply`-style AIClient method, matching the exact precedent recruiting's `DraftForm` already established (Phase 4): drafting content is always manual today, with an `isAIExtractionEnabled()`-gated banner reserved for if/when AI-assisted drafting is added later. Adding a new AIClient method just for this would be scope beyond what any existing drafting flow in the codebase does yet.
- **`pushGmailDraft` re-fetches the original message fresh via `getMessage` rather than storing its `From`/`Message-ID` header at draft-creation time** — those headers are only needed at the one moment an actual external write happens, and fetching them then (instead of persisting them alongside the excerpt) keeps to task 7.8's "no full mailbox storage" principle even for this flow. `GmailMessageContent` gained a `messageIdHeader` field (the RFC 2822 `Message-ID`, distinct from Gmail's own internal message `id`) specifically for constructing a correct `In-Reply-To`/`References`.
- **`gmail_drafts.gmail_item_id` is nullable with `on delete set null`** — if the source `gmail_items` row is later purged by retention (7.8) or a manual "delete all" (also 7.8), an already-created draft keeps its own independent `subject`/`content` and doesn't get cascaded away; only the *link back* to which review-queue item prompted it is lost, which is cosmetic.
- **UI** (`GmailDraftsSection`, `src/components/gmail/gmail-drafts-section.tsx`): a `proposed` draft is editable and has a "Push to Gmail as draft" button, disabled until `hasComposeScope`; a `created` draft becomes read-only (its Gmail-side copy is now the source of truth) with only a Delete (local bookkeeping only, doesn't touch the real Gmail draft) available.

### 7.8 notes

- **Retention is enforced at three layers, not one**: (1) extraction never persists the full message, only the AI's own excerpt (7.4); (2) every `gmail_items` row gets an `expires_at` at insert time from `settings.retention_days` (default `DEFAULT_GMAIL_RETENTION_DAYS = 30`, editable in Settings), and a new daily cron (`/api/cron/purge-gmail-items`, `vercel.json` `30 3 * * *`) hard-deletes anything past it; (3) a manual "Delete all stored Gmail data" button in Settings (`purgeGmailData`) for the "easy-to-find delete control" `docs/DATA_CLASSIFICATION.md` requires for Highly-sensitive tiers, clearing `gmail_items`/`gmail_drafts`/`gmail_processed_messages` immediately rather than waiting on the cron.
- **The excerpt itself is encrypted at rest** (7.4's notes) — retention bounds *how long* the ciphertext exists, encryption bounds *what's readable* if the row is ever exposed some other way (e.g. a Supabase dashboard query); `docs/DATA_CLASSIFICATION.md`'s "Highly sensitive tiers get mandatory application-layer encryption in addition to RLS" rule is why this reuses `src/lib/crypto.ts` rather than relying on RLS alone.
- **`gmail_processed_messages` is deliberately excluded from the purge** — it holds no content, only a message ID and a timestamp, so it isn't "email excerpt" data under the classification doc's tier; keeping it forever (or until a manual purge) is what lets the "never re-extract the same message" guarantee (7.3/7.4) hold even for a message whose extracted item(s) have since expired.
- **Disconnecting Gmail (existing `disconnectGmail` action, Settings) does not delete `gmail_items`/`gmail_drafts`/`gmail_processed_messages`** — same precedent as disconnecting Google Calendar, which doesn't delete synced `events` either; historical data survives a disconnect, and the separate "Delete all stored Gmail data" button is the explicit control for actually wiping it.
