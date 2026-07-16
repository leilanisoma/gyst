# Architecture

This file describes what **currently exists**. Do not add speculative future architecture here — that belongs in `PLAN.md`. Update this file only when actual code/infrastructure changes.

## Current state (Phase 8 complete)

A Next.js App Router app backed by Supabase, restricted to one allowed user.

```
gyst/
├── src/
│   ├── app/
│   │   ├── (app)/            # authenticated shell: nav + all product pages
│   │   │   ├── layout.tsx    # fetches the user + unread notifications, renders AppShell
│   │   │   ├── page.tsx      # Today: timeline, check-in, suggestions, rollover, outcomes
│   │   │   ├── actions.ts    # scheduling suggestions, accept/dismiss/undo, check-ins, daily plan
│   │   │   ├── inbox/        # capture + list + manual/AI conversion
│   │   │   ├── tasks/        # Kanban board + quick-edit
│   │   │   ├── notifications/actions.ts  # mark-read, push subscribe/unsubscribe, quiet hours
│   │   │   ├── settings/     # profile, Google Calendar, notifications, recurring schedule, install
│   │   │   ├── recruiting/   # opportunities/applications/contacts/documents/analytics/discovery sources (Phase 4-5); actions split by concern (actions.ts, contacts-actions.ts, documents-actions.ts, drafts-actions.ts, feedback-actions.ts, sources-actions.ts); capture/ pre-fills the opportunity form from the bookmarklet
│   │   │   ├── school/       # Canvas sync status, courses/assignments, assessment candidates + Upcoming Assessments,
│   │   │   │                 # syllabus upload/extraction review, milestone suggestions, actual-time log (Phase 6);
│   │   │   │                 # actions split by concern (actions.ts, assessment-actions.ts, documents-actions.ts,
│   │   │   │                 # syllabus-extraction-actions.ts, milestone-actions.ts, work-estimate-actions.ts)
│   │   │   ├── chat/         # streaming chat UI + conversation sidebar + pending-action approval (Phase 8);
│   │   │   │                 # actions.ts (conversations, approve/reject), memory-actions.ts (confirm/edit/
│   │   │   │                 # archive/delete/export), documents-actions.ts (index for search); memory/ subpage
│   │   │   └── wellness/     # stub page
│   │   ├── api/chat/         # streaming chat turn endpoint (SSE), authenticated (Phase 8)
│   │   ├── api/cron/         # discover-jobs (daily), weekly-digest, sync-canvas (daily, Phase 6) — bearer-secret auth (CRON_SECRET), no user session
│   │   ├── api/google/       # connect/callback route handlers (OAuth redirect + code exchange)
│   │   ├── login/            # magic-link sign-in
│   │   ├── auth/callback/    # PKCE code exchange
│   │   ├── auth/error/
│   │   ├── offline/          # service-worker fallback page (inline-styled, no deps)
│   │   ├── manifest.ts       # PWA manifest
│   │   ├── icon*.tsx, apple-icon.tsx, icon-*/route.tsx  # generated icons
│   │   └── layout.tsx        # root layout, metadata, service worker registration
│   ├── proxy.ts              # auth guard + session refresh (Next 16 "proxy", was middleware)
│   ├── ai/                   # provider-neutral AIClient (extractInboxItem, extractSyllabusItems,
│   │                         # extractGmailMessage, chat, embedText — chat/embedText added Phase 8);
│   │                         # providers/gemini.ts is the wired adapter, prompts/ holds versioned prompt text
│   │                         # including chat-system.ts (Phase 8 system prompt + injection-defense contract)
│   ├── components/
│   │   ├── nav/              # sidebar (desktop) + drawer (mobile) + notification bell
│   │   ├── capture/          # brain-dump capture form
│   │   ├── tasks/             # Kanban board, card, quick-edit sheet
│   │   ├── today/              # timeline, check-in, suggestions, overwhelm, outcomes, xp
│   │   ├── settings/            # Google integration card, notification settings, recurring schedule
│   │   ├── recruiting/            # opportunity/application/score/document/contact/draft UI (Phase 4) + discovery queue/sources/bookmarklet UI (Phase 5)
│   │   ├── school/                # sync status card, courses/assignments, assessment review queue + Upcoming
│   │   │                          # Assessments, syllabus upload/row/review-queue, milestone suggestions queue,
│   │   │                          # actual-time log (Phase 6)
│   │   ├── chat/                  # chat-shell (streaming input/output, sidebar, pending-action approval cards),
│   │   │                          # memory-review-list, document-index-list (Phase 8)
│   │   ├── ai/                # AI-extraction confirmation dialog
│   │   ├── pwa/                # install instructions, SW registration
│   │   └── ui/                 # shadcn/ui primitives (Base UI-backed)
│   └── lib/
│       ├── supabase/          # browser/server clients, proxy helper, service.ts (service-role, RLS-bypassing,
│       │                       # cron-only client added Phase 5), generated DB types
│       ├── chat/                # Phase 8: orchestrator.ts (tool-call loop), tools/ (typed registry — tasks/
│       │                       # schedule/school/recruiting/documents read tools, save_memory, propose_action,
│       │                       # search_memory/search_documents), action-schemas.ts + approve-action.ts
│       │                       # (write allowlist + re-validated execution), untrusted-content.ts (prompt-
│       │                       # injection wrapping), compaction.ts, usage.ts (token tracking/daily cap),
│       │                       # chunk-text.ts + document-index.ts (chunk/embed/cache documents for search)
│       ├── google/             # oauth, calendar (fetch-based REST client), tokens (encrypted),
│       │                       # integration (settings/status bookkeeping), sync, normalize, blocks
│       ├── job-sources/         # JobSourceAdapter contract + greenhouse/lever/curated_feed adapters,
│       │                       # classify.ts (keyword role-family/SWE/finance heuristics), ingest.ts +
│       │                       # run-discovery.ts (upsert/dedupe/expiry orchestration), weekly-digest.ts (Phase 5)
│       ├── canvas/              # fetch-based Canvas REST client (courses/assignments/calendar events),
│       │                       # sync.ts (courses/assignments/events/tasks/work_estimates/assessment-candidates/
│       │                       # milestones/dedup, one orchestrator), estimate.ts (deterministic duration
│       │                       # estimator), assessment-candidates.ts (keyword/points classifier),
│       │                       # integration.ts (status bookkeeping, mirrors google/integration.ts) (Phase 6)
│       ├── syllabus/            # pdf-text.ts (pdf-parse wrapper, per-page extraction), extract.ts (AI-gated
│       │                       # syllabus_items extraction, mirrors Inbox's isAIExtractionEnabled() gate) (Phase 6)
│       ├── assessments.ts       # ActionResult + assessment kind/preparation-status constants, shared across
│       │                       # recruiting-style domain modules (Phase 6)
│       ├── milestones.ts        # deterministic prep-checkpoint generator + createMilestoneSuggestions,
│       │                       # shared by Canvas sync and assessment confirmation (Phase 6)
│       ├── dedupe.ts            # fuzzy title/time-window event matching, distinct from recruiting.ts's
│       │                       # exact-key opportunityFingerprint (Phase 6)
│       ├── test/fake-supabase.ts # in-memory Supabase query-builder stand-in (select/eq/gte/lte/insert/update/
│       │                       # upsert/single/maybeSingle) shared by job-sources and canvas/milestones tests —
│       │                       # moved here from job-sources/fixtures/ when canvas tests needed it too (Phase 6)
│       ├── crypto.ts            # AES-256-GCM encrypt/decrypt for oauth_tokens
│       ├── notifications.ts     # create notification + best-effort push fan-out (accepts server or service client)
│       ├── webpush.ts            # VAPID-signed push send (wraps the `web-push` package)
│       ├── quiet-hours.ts        # local wall-clock quiet-hours check
│       ├── timeline.ts            # merges synced events + recurring schedules for Today
│       ├── tasks.ts            # task status/priority/area constants
│       ├── recruiting.ts          # role family/stage/relationship/document-kind constants + fingerprinting
│       ├── companies.ts          # findOrCreateCompany — shared by manual capture and discovery ingestion
│       ├── recruiting-preferences.ts # getTargetGradYear — shared scoring input
│       ├── job-scoring.ts          # deterministic PLAN.md §9 scoring engine (unit-tested)
│       ├── recruiting-analytics.ts # funnel/response-time/source-effectiveness/source-coverage (unit-tested)
│       └── env.ts               # Zod-validated env access (Google, encryption, VAPID, CRON_SECRET, Canvas — Phase 6)
├── supabase/migrations/         # profiles, preferences, inbox_items, tasks, projects, goals, ...,
│                                 # integrations, oauth_tokens, sync_runs, events, notifications,
│                                 # push_subscriptions, companies, opportunities, job_scores, applications,
│                                 # application_events, contacts, interactions, documents, drafts,
│                                 # source_configs, source_runs (Phase 5), courses, assignments, assessments,
│                                 # syllabus_items, work_estimates, milestone_suggestions (Phase 6),
│                                 # gmail_items, gmail_processed_messages, gmail_drafts (Phase 7),
│                                 # pgvector extension, conversations, messages, memory_items, memory_links,
│                                 # assistant_actions, document_chunks, ai_usage_events (Phase 8, not yet
│                                 # applied to the live project — see docs/PHASES/phase-8.md)
└── public/sw.js                 # offline-fallback service worker + push/notificationclick handlers
```

## Stack in use

| Layer | Choice |
|---|---|
| Web framework | Next.js 16 App Router + TypeScript, Turbopack |
| Mobile delivery | PWA — manifest, generated icons, install instructions (Settings), offline fallback |
| Styling | Tailwind CSS v4 + shadcn/ui (Base UI primitives), a warm "cozy" cream/terracotta theme |
| Database | Supabase Postgres, linked project, migrations in `supabase/migrations/` |
| Auth | Supabase Auth magic link, restricted to `ALLOWED_USER_EMAIL` at both the DB (trigger on `auth.users`) and app (`src/proxy.ts`) layers; RLS (`auth.uid() = user_id`/`id`) on every table |
| Drag-and-drop | @dnd-kit/core (Kanban board) |
| Validation | Zod (env vars, AI extraction schemas) |
| Testing | Vitest + React Testing Library (unit/component), Playwright installed for e2e (not yet used for a checked-in suite — verification so far has been ad hoc scripts run and discarded per session) |
| Type generation | `npm run db:types` regenerates `src/lib/supabase/database.types.ts` from the live schema |
| Google Calendar | Direct `fetch` calls to Google's OAuth/Calendar REST endpoints (`src/lib/google/`) — no `googleapis` SDK dependency |
| Token encryption | Node `crypto` (AES-256-GCM), `ENCRYPTION_KEY` env var — never plaintext at rest |
| Web push | `web-push` (VAPID), wrapped by `src/lib/webpush.ts` |
| Scheduled jobs | Vercel Cron (`vercel.json`) hitting normal Next.js route handlers under `/api/cron/*`, bearer-secret auth via `CRON_SECRET` — not Supabase Edge Functions, to avoid a second runtime for a single-user app |
| Canvas | Direct `fetch` calls to Canvas's REST API (`src/lib/canvas/client.ts`) with a static personal access token (`CANVAS_PERSONAL_ACCESS_TOKEN`) — no OAuth flow, no SDK dependency |
| PDF text extraction | `pdf-parse` (wraps `pdfjs-dist`) — deterministic parsing, not an AI call; only *identifying* syllabus items from the extracted text needs a model |
| Semantic memory | Postgres + `pgvector` (Phase 8) — `document_chunks`/`memory_items` embeddings, searched via `match_document_chunks`/`match_memory_items` RPCs (cosine distance); migration not yet applied to the live project |

AI provider is **Google Gemini** (`gemini-2.5-flash-lite`, chosen for cost — see `docs/DECISIONS/0002-gemini-ai-provider.md`; embeddings use `text-embedding-004`). The provider-neutral `AIClient` interface (`src/ai/client.ts`) covers `extractInboxItem`, `extractSyllabusItems` (Phase 6), `extractGmailMessage` (Phase 7), and `chat`/`embedText` (Phase 8, multi-turn function-calling + embeddings for the universal chatbot); `src/ai/providers/gemini.ts` implements all of it via raw `fetch` against Gemini's REST API (no SDK dependency, matching every other connector in this codebase), and prompt text lives in `src/ai/prompts/` as versioned files rather than inline strings. `getAIClient()` (`src/ai/index.ts`) returns a real client once `AI_PROVIDER=gemini` and `GEMINI_API_KEY` are set in `.env.local` — with either unset it still returns `null`, so `isAIExtractionEnabled()` keeps the Inbox "Extract with AI" action and the syllabus/Gmail extraction paths hidden rather than erroring, and `/chat` shows a "not configured" state instead of erroring. Adding a second provider means a new file implementing `AIClient` plus a branch in `getAIClient()` — no changes to `src/lib/syllabus/extract.ts`, `src/lib/gmail/extract.ts`, `src/lib/chat/`, or any UI.

## Notable decisions from Phase 1

- **IA gap:** PLAN.md §5's nav doesn't list "Tasks" (the board is meant to be reachable via Today's filters, which don't exist until Phase 2). Added it as a top-level nav item so the board has a home; revisit once Today ships.
- **Note conversion has no destination table.** PLAN.md §6 doesn't define a `notes` table. Converting an inbox item "to a note" just marks it `converted`/`converted_to: 'note'` with no `converted_id` — the text stays in `inbox_items.raw_text`.
- **Migrations run via the Supabase CLI against the transaction pooler** (`aws-1-<region>.pooler.supabase.com:6543`), not the direct `db.<ref>.supabase.co` host — this sandbox has no outbound IPv6, and the direct host is IPv6-only on this project.

## Notable decisions from Phase 3

See `docs/PHASES/phase-3.md`'s Notes section for the full list (scope choices, sync-cursor storage, write-back timing, etc.). Highlights: OAuth/Calendar API access is hand-rolled over `fetch` rather than the `googleapis` SDK; write scope uses the narrow `calendar.app.created` grant so "write only to a dedicated GYST calendar" is enforced by Google, not just app logic; `notifications`/`push_subscriptions` are pragmatic additions beyond PLAN.md §6, same precedent as Phase 2's `xp_events`.

## Notable decisions from Phase 4

See `docs/PHASES/phase-4.md`'s Notes section for the full list. Highlights: every saved opportunity auto-creates its `applications` row (manual curation, not passive discovery, so there's no triage backlog to keep separate); job scoring seeds deterministically from PLAN.md §9's formula and stays user-editable for the three dimensions with no reliable non-AI signal; `documents` uploads go browser → Storage directly (RLS-enforced by folder) with the server action only recording metadata; drafts stay manual behind the same `isAIExtractionEnabled()` gate as Inbox; funnel analytics compute live rather than materializing `recruiting_insights`. First real Storage bucket usage in the codebase (private `documents` bucket, folder-scoped RLS).

## Notable decisions from Phase 5

See `docs/PHASES/phase-5.md`'s Notes section for the full list. Highlights: `JobSourceAdapter` (discover/normalize/healthCheck) with real Greenhouse/Lever adapters and a curated internship-feed adapter (Pitt CSC/Simplify's `listings.json`); discovery lands in a new `discovered` application stage, kept out of the main board/table (a firehose next to already-decided roles violates the anxiety-aware UX principle) and surfaced instead in a score-sorted Discovery queue with thumbs up/down/not-relevant feedback; daily discovery and a weekly digest run via Vercel Cron, not Supabase Edge Functions; LinkedIn/Handshake capture is a bookmarklet, not a browser extension (no store review, no per-browser maintenance); source coverage (relevance rate per source) is now measured, but no paid search API was evaluated or integrated — PLAN.md explicitly gates that decision behind this measurement existing first.

## Notable decisions from Phase 6

See `docs/PHASES/phase-6.md`'s Notes section for the full list. Highlights: Canvas access uses a static personal-access-token/`fetch` client, not OAuth — confirmed working against the real account before building anything else (task 6.1), so PLAN.md's conditional `.ics`-import fallback (task 6.5) was skipped as unneeded rather than built speculatively; Canvas calendar entries reuse the existing `events` table and syllabus uploads reuse the existing `documents` table (`source`/`kind` widened, new `course_id`) instead of PLAN.md's originally separate `course_events` table; `generateTimeBlockSuggestions` needed zero code changes for task 6.10 since it already selects every incomplete task regardless of area — Canvas sync just mirrors assignments into `tasks`; assessment-candidate classification (6.4) and milestone-worthiness (6.7) are both deterministic keyword/points heuristics, matching CLAUDE.md's "deterministic logic never lives behind a prompt" rule; syllabus PDF extraction (6.6) is a fully-wired but currently-inert AI-gated framework (`extractSyllabusItems` on `AIClient`), following the exact `isAIExtractionEnabled()` gate Inbox already established, so it activates automatically once Phase 0's provider decision lands with no further plumbing; event dedup (6.9) is fuzzy title+time-window matching, distinct from recruiting's exact-key fingerprint, since Canvas and Google share no stable external ID for the same real-world event.

## Notable decisions from Phase 7

See `docs/PHASES/phase-7.md`'s Notes section for the full list. Highlights: Gmail is confirmed to be a different Google account than the one connected for Calendar (task 7.1), so it's a second `provider = 'gmail'` row on `integrations`/`oauth_tokens`/`sync_runs` — not a scope upgrade on the existing `'google'` connection — with its own callback route/redirect URI (`GMAIL_REDIRECT_URI`) but the same registered OAuth client (`GOOGLE_CLIENT_ID`/`SECRET`, since those identify the app, not the account); `google/oauth.ts`'s token-exchange functions gained an optional `redirectUri` override (defaulting to Calendar's existing behavior) so Gmail reuses them instead of duplicating the OAuth2 exchange; sync only ever reads whatever Gmail search query/label the user configures in Settings (task 7.3) and refuses to run with none set — there's no default, unlike Canvas's always-on courses/assignments sync; extraction (7.4) is a fully-wired but currently-inert AI-gated framework, identical precedent to syllabus extraction (6.6); only the AI's own short excerpt is ever persisted, encrypted, never the message body (7.8's "no full mailbox storage"), and `gmail_processed_messages` (no content, just IDs) is what lets re-syncs skip already-seen messages without re-fetching them; draft replies (7.7) are a two-step explicit-approval flow — a `gmail_drafts` row proposed entirely inside GYST, then a separate "push to Gmail" action that actually calls the Gmail API's `drafts.create` (never a send endpoint) and requires the incremental `gmail.compose` scope, mirroring Calendar's write-scope-is-opt-in pattern; retention is a per-user `settings.retention_days` (default 30) written as each item's `expires_at` at extraction time, purged by a new daily cron, plus a manual "delete all stored Gmail data" control in Settings for the Highly-sensitive-tier "easy-to-find delete" requirement (`docs/DATA_CLASSIFICATION.md`).

## Notable decisions — Gemini AI provider

See `docs/DECISIONS/0002-gemini-ai-provider.md` for the full record. Highlights: Gemini 2.5 Flash-Lite chosen over Anthropic/OpenAI for per-token cost at this app's single-user volume; integration is raw `fetch` against Gemini's REST API (`src/ai/providers/gemini.ts`), not the `@google/genai` SDK, matching every other connector in this codebase; Gemini's native `responseSchema` forces JSON shape, but callers still re-validate with Zod since model output is untrusted regardless; this activates the previously-inert syllabus (6.6) and Gmail (7.4) extraction paths with zero changes to their code, confirming the provider-neutral `AIClient` design worked as intended. Job scoring dimensions, draft generation, and discovery classification (Phase 4/5) remain deterministic by design, unrelated to provider availability — see those phases' notes.

## Notable decisions — Phase 8

See `docs/PHASES/phase-8.md`'s Notes section for the full list. Highlights:
chat "streaming" is transport-level, not generation-level — `AIClient.chat`
is one non-streaming call (the tool-call loop needs the full response
anyway), and `/api/chat` flushes the finished answer to the browser
word-by-word over real SSE; read tools (`get_tasks`/`get_schedule`/
`get_school_overview`/`get_recruiting_overview`/`get_documents`) return flat
per-table lists rather than Supabase's embedded-join select syntax, so every
tool stays testable against `FakeSupabase`; the only write-shaped tool,
`propose_action`, never performs a real write — it only inserts an
`assistant_actions` preview row, and a fixed three-type allowlist
(`create_task`/`update_task`/`create_goal`, `src/lib/chat/action-schemas.ts`)
is re-validated at approval time, not trusted from the proposal; health/
wellness exclusion is enforced by a `registerTool` guard that throws on
`dataTier: "highly_sensitive"` rather than by omission, so it's ready before
Phase 9 adds real health tables; the new migration
(`20260715000001_chat_memory_schema.sql`) has not been applied to the live
Supabase project in this sandbox (no `SUPABASE_ACCESS_TOKEN`), so
`database.types.ts` was hand-edited to match it — regenerate for real via
`supabase db push && npm run db:types` before shipping.

## Planned, not yet built

- A "confirm and promote to assessment" action for syllabus items — `syllabus_items` (Phase 6) has its own confirm/dismiss review queue but nothing yet turns a confirmed item into an `assessments` row, which is also why Canvas-vs-syllabus assessment dedup (task 6.9) has no live collision surface to resolve today.
- Automatic in-app deadline/block-reminder notifications outside recruiting — only the connector-error path and the new weekly recruiting digest send one today; Today's other reminder surfaces are still always-visible in-app lists, same reasoning as Phase 3.
- Live end-to-end verification of the Gmail OAuth flow, sync, and draft-push against a real Gmail account — same sandbox limitation as every other browser-auth OAuth flow in this repo (Phase 3/4/5/6 all flagged the same gap); covered instead by unit tests against mocked `fetch` (`src/lib/gmail/client.test.ts`, `sync.test.ts`, `extract.test.ts`) and `tsc`/`eslint`.
- A predicted-vs-actual duration accuracy view (Phase 6 task 6.8) — no completed school tasks have logged actual time yet in the live account, so there's nothing real to chart.
- Live end-to-end verification of real AI extraction/chat/embeddings against Gemini — every adapter method and prompt is wired and unit-tested against mocked `fetch` (`src/ai/providers/gemini.test.ts`), but no one has run any of it against a real `GEMINI_API_KEY` yet to confirm output quality; same "unverified beyond mocks" caveat every OAuth-gated phase has flagged, applied here to the AI call itself.
- The Phase 8 migration applied to the live Supabase project, and `database.types.ts` regenerated for real from it (see Notable decisions above).
- Real per-token model streaming, conversation rename in the chat UI, and auto-indexing documents into `document_chunks` on upload — all deliberately deferred; see `docs/PHASES/phase-8.md`'s Notes for why.

Keep this section truthful, not aspirational, as each phase lands.
