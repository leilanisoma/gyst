# Architecture

This file describes what **currently exists**. Do not add speculative future architecture here — that belongs in `PLAN.md`. Update this file only when actual code/infrastructure changes.

## Current state (Phase 11 complete; Phase 9D in progress — 9D-1 and 9D-2 of 9D-1..9D-6 done)

A Next.js App Router app backed by Supabase, restricted to one allowed user.

```
gyst/
├── src/
│   ├── app/
│   │   ├── (app)/            # authenticated shell — no sidebar (Phase 9D removed it); FloatingChrome
│   │   │   │                 # (small floating pills, nav/) is the only persistent chrome on every page
│   │   │   ├── layout.tsx    # fetches the user + unread notifications + derives companion state (Phase 9C),
│   │   │   │                 # renders AppShell/FloatingChrome/RouteTransition/CompanionChatLauncher globally
│   │   │   ├── page.tsx      # Today = the "Living Room" hub (Phase 9D): RoomBackground behind everything;
│   │   │   │                 # journal/mailbox/thermostat render as small draggable AmbientObjects that open
│   │   │   │                 # in-place popups (AmbientObjectPopup) instead of navigating; the journal popup
│   │   │   │                 # holds capture/check-in/top-outcomes + the full inbox list, a separate
│   │   │   │                 # PlannerPopup (the greeting pill) holds timeline/rollover/time-blocks/weekly-goals/
│   │   │   │                 # overwhelm-mode; XpGrowthVisual (ambient plant, replaces the old numeric XP)
│   │   │   ├── actions.ts    # scheduling suggestions, accept/dismiss/undo, check-ins, daily plan
│   │   │   ├── inbox/        # capture + list + manual/AI conversion (inbox-list.tsx is also rendered inline
│   │   │   │                 # inside the hub's journal popup, not duplicated — same component, two callers)
│   │   │   ├── tasks/        # Kanban board + quick-edit — no longer a room/doorway (Phase 9D dropped the
│   │   │   │                 # doorway grid); still a real route, reachable by direct link
│   │   │   ├── notifications/actions.ts  # mark-read, push subscribe/unsubscribe, quiet hours
│   │   │   ├── settings/     # page.tsx is now a thin RoomContentPanel wrapper; settings-content.tsx holds the
│   │   │   │                 # actual profile/Google-Calendar/notifications/recurring-schedule/install content —
│   │   │   │                 # split (Phase 9D room map v6) so the hub's thermostat popup can render the exact
│   │   │   │                 # same content without duplicating queries; direct /settings nav still works too
│   │   │   ├── gmail/        # same content/route split as settings/ (gmail-content.tsx) — reused by the hub's
│   │   │   │                 # mailbox popup; the review queue/drafts UI itself is unchanged from Phase 7
│   │   │   ├── recruiting/   # opportunities/applications/contacts/documents/analytics/discovery sources (Phase 4-5); actions split by concern (actions.ts, contacts-actions.ts, documents-actions.ts, drafts-actions.ts, feedback-actions.ts, sources-actions.ts); capture/ pre-fills the opportunity form from the bookmarklet; reached via the hub's sliding filmstrip (Phase 9D), themed as an office/desk (9D-4) not yet done
│   │   │   ├── school/       # Canvas sync status, courses/assignments, assessment candidates + Upcoming Assessments,
│   │   │   │                 # syllabus upload/extraction review, milestone suggestions, actual-time log (Phase 6);
│   │   │   │                 # actions split by concern (actions.ts, assessment-actions.ts, documents-actions.ts,
│   │   │   │                 # syllabus-extraction-actions.ts, milestone-actions.ts, work-estimate-actions.ts);
│   │   │   │                 # reached via the filmstrip, themed as a study nook (9D-5) not yet done
│   │   │   ├── chat/         # full-page chat UI (conversation sidebar + history, /chat?c=id) — reached via the
│   │   │   │                 # companion chat launcher (Phase 8, chrome swapped for the blob in Phase 9C/9D),
│   │   │   │                 # not a nav tab; actions.ts (conversations,
│   │   │   │                 # approve/reject, getChatPanelData for client-driven refetch), memory-actions.ts
│   │   │   │                 # (confirm/edit/archive/delete/export), documents-actions.ts (index for search)
│   │   │   │                 # memory/ subpage
│   │   │   └── wellness/     # check-in form, weekly trend observations, history, manual health-metrics
│   │   │                     # entry, cycle tracking, export/delete-all (Phase 9A/9B); themed as a greenhouse
│   │   │                     # room (Phase 9D-2, reached via the filmstrip) — two RoomContentPanels placed
│   │   │                     # over the art (check-in + trends always visible; history/health/cycle/data
│   │   │                     # collapsed behind <details>), plus an ambient GrowthPlant fed by check-in
│   │   │                     # consistency, not XP — this split-panel/collapse pattern is the default template
│   │   │                     # for 9D-4/9D-5 unless their content clearly needs something different
│   │   ├── api/chat/         # streaming chat turn endpoint (SSE), authenticated (Phase 8)
│   │   ├── api/cron/         # discover-jobs (3h), weekly-digest, sync-canvas (daily), sync-gmail (hourly), sync-calendar (nightly), deadline-reminders (daily), purge-gmail-items (daily) — bearer-secret auth (CRON_SECRET), no user session; scheduled by Supabase pg_cron (Phase 11), not vercel.json
│   │   ├── api/google/       # connect/callback route handlers (OAuth redirect + code exchange)
│   │   ├── login/            # password sign-in (docs/DECISIONS/0004-password-auth-for-login.md)
│   │   ├── auth/callback/    # PKCE code exchange — unused since the login flow moved off magic link (0004); left in place, harmless
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
│   │   ├── nav/              # SidebarNav/MobileNav/TopBar all deleted (Phase 9D — no more dashboard chrome).
│   │   │                     # floating-chrome.tsx: home/notification-bell/email/sign-out as small floating
│   │   │                     # backdrop-blur pills instead of a header bar; route-transition.tsx: page-swap
│   │   │                     # (fade) or filmstrip-slide (Wellness/Recruiting/School) via RouteTransition
│   │   ├── room/              # Phase 9D shared room mechanics/dressing, used by every room page:
│   │   │                     # room-background.tsx (full-bleed day-period-matched art), room-content-panel.tsx
│   │   │                     # (the "liquid glass" panel — .room-glass in globals.css), room-header.tsx
│   │   │                     # (plain title/description, no icon badge), room-loading.tsx (room-aware Suspense
│   │   │                     # fallback, avoids the flat-color loading flash), room-slide-arrows.tsx (filmstrip
│   │   │                     # nav for Wellness/Recruiting/School), ambient-object.tsx (draggable floating PNG
│   │   │                     # for journal/mailbox/thermostat, position persisted to localStorage),
│   │   │                     # ambient-object-popup.tsx (Dialog-based in-place popup, reused by journal/
│   │   │                     # mailbox/thermostat), planner-popup.tsx + journal-popup-body.tsx (the hub's two
│   │   │                     # popups' actual content), room-popup-content.tsx (shared Dialog chrome for both),
│   │   │                     # growth-plant.tsx (the ambient growing-plant primitive, shared by the hub's
│   │   │                     # XpGrowthVisual and Wellness's check-in-driven version, Phase 9D-2)
│   │   ├── companion/         # companion-blob.tsx (Phase 9C) — SVG blob + face, state-driven
│   │   │                     # (fencing/studying/recruiting/resting/focused/idle from src/lib/companion.ts,
│   │   │                     # no manual status-setting); launched globally via chat/companion-chat-launcher.tsx
│   │   ├── theme/             # day-period-provider.tsx — reads local time client-side, sets
│   │   │                     # data-day-period on <html> (dawn/day/dusk/night palette + art selection)
│   │   ├── capture/          # brain-dump capture form
│   │   ├── tasks/             # Kanban board, card, quick-edit sheet
│   │   ├── today/              # fixed-timeline, check-in, time-block-suggestions, overwhelm-mode,
│   │   │                       # rollover-review-list, top-outcomes-card, weekly-goals-list, greeting.tsx
│   │   │                       # (time-of-day greeting text), xp-growth-visual.tsx (now a thin wrapper around
│   │   │                       # room/growth-plant.tsx, Phase 9D-2)
│   │   ├── wellness/            # check-in form, history, health-summary-form, cycle-import-card,
│   │   │                       # data-controls (Phase 9A/9B)
│   │   ├── settings/            # Google/Gmail integration cards, notification settings, recurring schedule
│   │   ├── gmail/                # drafts section, review queue (Phase 7 UI, unchanged by the Phase 9D content split)
│   │   ├── recruiting/            # opportunity/application/score/document/contact/draft UI (Phase 4) + discovery queue/sources/bookmarklet UI (Phase 5)
│   │   ├── school/                # sync status card, courses/assignments, assessment review queue + Upcoming
│   │   │                          # Assessments, syllabus upload/row/review-queue, milestone suggestions queue,
│   │   │                          # actual-time log (Phase 6)
│   │   ├── chat/                  # companion-chat-launcher.tsx (global chrome-less blob button — the actual
│   │   │                          # chat entry point, Phase 9C/9D, replaced the old floating-chat.tsx pill),
│   │   │                          # chat-shell.tsx (mode: "page" | "floating", shared by the launcher's Sheet
│   │   │                          # and /chat), memory-review-list, document-index-list (Phase 8)
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
│       │                       # chunk-text.ts + document-index.ts (chunk/embed/cache documents for search),
│       │                       # panel-data.ts (ChatPanelData + loadChatPanelData, shared by /chat's server
│       │                       # render and the getChatPanelData action the launcher's Sheet refetches from),
│       │                       # embedding.ts (toPgVector — pgvector columns/RPC params are a text literal
│       │                       # over PostgREST, not a JSON array; fixed 2026-07-21 after the Phase 8 migration
│       │                       # was confirmed actually applied and real generated types caught the mismatch —
│       │                       # `database.types.ts` had been hand-edited with the wrong (permissive) shape)
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
│       ├── health/              # cycle-observations.ts, daily-summaries.ts — manual health-metrics/cycle entry
│       │                       # (Phase 9B, after the native HealthKit companion was abandoned — see phase-9.md)
│       ├── wellness.ts          # WellnessCheckIn type, weeklyTrendObservations (descriptive-only trend text,
│       │                       # never causal/diagnostic), checkInDaysThisWeek + wellnessGrowthStage (Phase 9D-2,
│       │                       # feeds the greenhouse's ambient GrowthPlant from check-in consistency, not XP)
│       ├── gamification.ts / gamification-log.ts # xp_events point values + growthStage/daysEngagedThisWeek
│       │                       # (drives the hub's XpGrowthVisual; unchanged data/logic since Phase 2, display
│       │                       # layer swapped from a number to a plant in Phase 9D)
│       ├── motion.ts            # shared easing/spring/duration tokens (Phase 9C) — CSS custom properties drive
│       │                       # plain Tailwind transitions, the same numeric constants drive motion/react
│       ├── companion.ts         # deterministic mapping of real signals (calendar/tasks/check-ins) to one of six
│       │                       # companion states — fencing/studying/recruiting/resting/focused/idle (Phase 9C);
│       │                       # never reads highly-sensitive wellness data, never reaches chat/AI context
│       ├── day-period.ts        # dawn/day/dusk/night from local time — the palette + room-art selector (Phase 9D)
│       ├── greeting.ts          # time-of-day greeting phrase (finer-grained hour buckets than day-period's 4)
│       ├── rooms.ts             # ROOMS (Wellness/Recruiting/School — href/label/background) + AMBIENT_OBJECTS
│       │                       # (Gmail/Inbox/Settings — href/label/image/accent) (Phase 9D)
│       ├── room-sequence.ts     # filmstrip order (Garden—Living Room—Nook—Study Desk) for RouteTransition/
│       │                       # RoomSlideArrows' slide-vs-fade decision (Phase 9D)
│       ├── use-draggable-position.ts # shared drag + localStorage-persisted-offset hook — AmbientObject and
│       │                       # CompanionChatLauncher both use it instead of duplicating Framer drag logic
│       ├── tasks-deadline-reminders.ts # scans tasks.due_date (the universal board, so recruiting next-actions
│       │                       # and school assessments are covered too) for anything due within 24h, notifies
│       │                       # once via notifications.ts (Phase 11 — fills the `deadline` kind that existed
│       │                       # since Phase 3 but nothing had ever created one)
│       └── env.ts               # Zod-validated env access (Google, encryption, VAPID, CRON_SECRET, Canvas — Phase 6)
├── supabase/migrations/         # profiles, preferences, inbox_items, tasks, projects, goals, ...,
│                                 # integrations, oauth_tokens, sync_runs, events, notifications,
│                                 # push_subscriptions, companies, opportunities, job_scores, applications,
│                                 # application_events, contacts, interactions, documents, drafts,
│                                 # source_configs, source_runs (Phase 5), courses, assignments, assessments,
│                                 # syllabus_items, work_estimates, milestone_suggestions (Phase 6),
│                                 # gmail_items, gmail_processed_messages, gmail_drafts (Phase 7),
│                                 # pgvector extension, conversations, messages, memory_items, memory_links,
│                                 # assistant_actions, document_chunks, ai_usage_events (Phase 8 — confirmed
│                                 # actually applied to the live project 2026-07-21, via `supabase migration list`;
│                                 # `database.types.ts` regenerated for real from it the same day, see
│                                 # embedding.ts above), wellness_check_ins (Phase 9A), device_pairing_codes +
│                                 # device_tokens (Phase 9B, dead — the native-companion pairing flow they were
│                                 # for was abandoned; left as-is, no live rows), health_daily_summaries,
│                                 # cycle_observations (Phase 9B manual entry), tasks.deadline_notified_at
│                                 # (Phase 11 dedup guard) — no schema changes for Phase 9C/9D, display-layer only
└── public/sw.js                 # offline-fallback service worker + push/notificationclick handlers
```

## Stack in use

| Layer | Choice |
|---|---|
| Web framework | Next.js 16 App Router + TypeScript, Turbopack |
| Mobile delivery | PWA — manifest, generated icons, install instructions (Settings), offline fallback |
| Styling | Tailwind CSS v4 + shadcn/ui (Base UI primitives), a warm "cozy" cream/terracotta theme |
| Database | Supabase Postgres, linked project, migrations in `supabase/migrations/` |
| Auth | Supabase Auth password sign-in (`docs/DECISIONS/0004-password-auth-for-login.md`), restricted to `ALLOWED_USER_EMAIL` at both the DB (trigger on `auth.users`) and app (`src/proxy.ts`) layers; RLS (`auth.uid() = user_id`/`id`) on every table |
| Drag-and-drop | @dnd-kit/core (Kanban board) |
| Validation | Zod (env vars, AI extraction schemas) |
| Testing | Vitest + React Testing Library (unit/component), Playwright installed for e2e (not yet used for a checked-in suite — verification so far has been ad hoc scripts run and discarded per session) |
| Type generation | `npm run db:types` regenerates `src/lib/supabase/database.types.ts` from the live schema |
| Google Calendar | Direct `fetch` calls to Google's OAuth/Calendar REST endpoints (`src/lib/google/`) — no `googleapis` SDK dependency |
| Token encryption | Node `crypto` (AES-256-GCM), `ENCRYPTION_KEY` env var — never plaintext at rest |
| Web push | `web-push` (VAPID), wrapped by `src/lib/webpush.ts` |
| Scheduled jobs | Supabase `pg_cron`/`pg_net` (Phase 11) hitting normal Next.js route handlers under `/api/cron/*`, bearer-secret auth via `CRON_SECRET` (looked up from Supabase Vault at schedule time, never committed) — not Vercel Cron (Hobby plan caps at 2 jobs/day, insufficient once cadences went below daily) and not Supabase Edge Functions, to avoid a second runtime for a single-user app |
| Canvas | Direct `fetch` calls to Canvas's REST API (`src/lib/canvas/client.ts`) with a static personal access token (`CANVAS_PERSONAL_ACCESS_TOKEN`) — no OAuth flow, no SDK dependency |
| PDF text extraction | `pdf-parse` (wraps `pdfjs-dist`) — deterministic parsing, not an AI call; only *identifying* syllabus items from the extracted text needs a model |
| Semantic memory | Postgres + `pgvector` (Phase 8) — `document_chunks`/`memory_items` embeddings, searched via `match_document_chunks`/`match_memory_items` RPCs (cosine distance); embeddings must be passed as pgvector's text literal (`src/lib/chat/embedding.ts`'s `toPgVector`), not a raw array — PostgREST/Postgres reject a JSON array for a `vector` column/param |

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

See `docs/PHASES/phase-5.md`'s Notes section for the full list. Highlights: `JobSourceAdapter` (discover/normalize/healthCheck) with real Greenhouse/Lever adapters and a curated internship-feed adapter (Pitt CSC/Simplify's `listings.json`); discovery lands in a new `discovered` application stage, kept out of the main board/table (a firehose next to already-decided roles violates the anxiety-aware UX principle) and surfaced instead in a score-sorted Discovery queue with thumbs up/down/not-relevant feedback; discovery (every 3h) and the weekly digest run via Supabase pg_cron as of Phase 11 (originally Vercel Cron), not Supabase Edge Functions; LinkedIn/Handshake capture is a bookmarklet, not a browser extension (no store review, no per-browser maintenance); source coverage (relevance rate per source) is now measured, but no paid search API was evaluated or integrated — PLAN.md explicitly gates that decision behind this measurement existing first.

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
Phase 9 adds real health tables; the migration
(`20260715000001_chat_memory_schema.sql`) was hand-edited into
`database.types.ts` at the time rather than generated for real (no
`SUPABASE_ACCESS_TOKEN` in that session's sandbox) — confirmed **applied**
and regenerated for real 2026-07-21, while fixing this file's own staleness
(`supabase migration list --linked` showed every local migration through
Phase 11 present on the remote, including this one). That regeneration
caught a real bug the hand-edited version had masked: see
`src/lib/chat/embedding.ts` above.

## Notable decisions — Phase 9 (9A/9B)

See `docs/PHASES/phase-9.md`'s Notes section for the full list. Highlights:
9A shipped a lightweight, fully-skippable daily check-in
(`wellness_check_ins`) plus neutral, descriptive-only weekly trend text
(`weeklyTrendObservations` — "energy was logged as low on 3 of 5 days,"
never causal or diagnostic language, PLAN.md §11); 9B's native SwiftUI/
HealthKit iPhone companion was **abandoned outright** — no Apple Developer
account — and resolved instead as manual web-form entry
(`health_daily_summaries`, `HealthSummaryForm`) plus manual/CSV cycle-data
import (`cycle_observations`), so `device_pairing_codes`/`device_tokens`
exist in the schema but are dead, no live rows; all of this data stays
excluded from chat/AI context by construction (`registerTool`'s
`dataTier: "highly_sensitive"` guard from Phase 8), not by convention.

## Notable decisions — Phase 9C (motion + companion character)

See `docs/PHASES/phase-9c.md`'s Notes section for the full list. Highlights:
one shared motion vocabulary (`src/lib/motion.ts` + `--motion-*`/
`--shadow-cozy` CSS custom properties) drives both plain Tailwind
transitions and `motion/react` animations, kept in sync by hand (a comment
at each end points to the other); the companion blob's state
(`src/lib/companion.ts`) is a deterministic mapping from real signals
(recurring fencing/class schedules or synced calendar events, in-progress
task areas, today's capacity check-in, overdue recruiting next-actions) to
one of six states — no manual status-setting, no AI call, and it never
reads highly-sensitive wellness data or reaches chat context.

## Notable decisions — Phase 9D (spatial living-room redesign)

The biggest visual overhaul in the app's history — full account across
eight dated revisions in `docs/PHASES/phase-9d.md` (room maps v1 through
v8), condensed here to what's true **now**:

- **No more sidebar, no more numeric XP.** `SidebarNav`/`MobileNav`/`TopBar`
  are deleted. `FloatingChrome` (small floating backdrop-blur pills, not a
  header bar) carries the home link/notification bell/email/sign-out on
  every page. The numeric XP/"days engaged" readout is gone — `XpGrowthVisual`
  (a little ambient plant, `src/lib/gamification.ts`'s `growthStage`
  unchanged) replaces it, same underlying `xp_events` data, display layer only.
- **The Today hub is a spatial "Living Room" scene**, not a dashboard: a
  full-bleed AI-illustrated background (`RoomBackground`, one PNG per
  dawn/day/dusk/night) with Gmail/Inbox/Settings as small draggable
  `AmbientObject`s (mailbox/journal/thermostat, alpha-transparent cutouts,
  position persisted to `localStorage`) that open in-place popups
  (`AmbientObjectPopup`, a base-ui Dialog) instead of navigating — except
  the *content* inside those popups (`GmailContent`/`SettingsContent`) is
  the exact same server-rendered content as the standalone `/gmail`/
  `/settings` routes, via a content-component/route-wrapper split, so
  nothing is duplicated or re-fetched differently.
- **Wellness/Recruiting/School are reached by sliding through a filmstrip**
  (`RoomSlideArrows`, order Garden—Living Room—Nook—Study Desk), not by
  clicking a doorway — the original `RoomDoorway`/`RoomHeader`
  shared-element zoom transition was built, then removed once nothing used
  it anymore. Each has its own room-art background; Wellness is themed
  (9D-2, Phase 9D-2 above), Recruiting/School are not yet (9D-4/9D-5 open).
- **The room art is AI-generated** (DreamShaper XL + an Animal Crossing SDXL
  LoRA, local ComfyUI on Ishani's Mac — install/prompt recipe intentionally
  not committed, it includes an API key) rather than hand-coded SVG or a
  cloud API, once flat-colored-circle placeholders didn't read as
  "illustrated" enough. Object cutouts (mailbox/journal/thermostat) got a
  genuine alpha-transparent background-removal pass via a one-off Python/
  Pillow flood-fill script, not a global color threshold (the source art's
  soft vignette gradients would leave a visible ring with a naive threshold).
- **`.room-glass`** (`globals.css`) is the shared "liquid glass" material
  (blur + saturate + a diagonal sheen `::before` + three stacked shadows)
  used by every room's content panel and popup — an unlayered CSS rule (like
  `.room-glass` itself and the night-mode heading-font override), since
  Tailwind's own utilities live inside a cascade layer and an unlayered rule
  always wins regardless of specificity/order, avoiding `!important`.
- **The companion blob is the persistent global chat launcher** now
  (`CompanionChatLauncher`), not a decorative Today-only status indicator —
  zero chrome (a bare `<button>`, no pill behind it), sits on the couch on
  the hub (absolute % position) and at a fixed bottom-right spot everywhere
  else; giving it a real position in every room (not just the hub) and
  matching the illustrated art style are both still open (9D-6).
- Not yet re-verified live in a real browser by anyone other than Ishani
  herself checking visually per-session (this sandbox is auth-gated); the
  2026-07-21 Wellness (9D-2) session did verify visually, via a scripted
  authenticated Playwright session against the local dev server — see
  Phase 9D-2's notes in `phase-9d.md` for that pattern.

## Notable decisions — Phase 10 (polish and reliability, ongoing)

No fixed exit criteria — a running dated session log in
`docs/PHASES/phase-10.md`, not a checklist here. Highlights so far: Google/
Gmail token-refresh failures degrade to a clean `{ok: false}` instead of
crashing Settings or the sync routes; the OAuth account picker is forced
open (`prompt: "consent select_account"`) since Gmail and Calendar are
deliberately two different Google accounts and the browser was silently
reusing whichever was already logged in; login was rebuilt from
`signInWithOtp` (magic link, then a 6-digit code) to plain
`signInWithPassword` after a chain of unrelated failures made passwordless
login unworkably fragile for a single-user app (`docs/DECISIONS/0004`);
first real production deploy (`ishanigyst.vercel.app`), which is also where
the Vercel Hobby cron-cap gap (Phase 11) was first noticed.

## Notable decisions — Phase 11

See `docs/PHASES/phase-11.md` / `docs/DECISIONS/0005-pg-cron-scheduling.md`
for the full account. Highlights: all scheduled jobs moved from
`vercel.json` (Vercel Hobby's 2-job/day cap meant most weren't actually
firing) to Supabase `pg_cron`/`pg_net`, calling the same `/api/cron/*`
routes with no route code changes — the bearer secret is stored once in
Supabase Vault and looked up by name inside each scheduled statement, never
committed; two routes are new — `sync-calendar` (Google Calendar had no
automation at all before this, only a manual Settings button) and
`deadline-reminders` (fills `notifications.kind = 'deadline'`, which existed
since Phase 3 but nothing had ever created one — scans `tasks.due_date`,
the universal board, so it covers recruiting/school/wellness/general in one
query); last-run visibility uses pg_cron's own `cron.job_run_details` rather
than a new bespoke table; verified end-to-end two ways — a direct curl
against production, then a manual `net.http_get` run through Postgres
itself (not curl) to confirm Supabase's network can actually reach Vercel
with the Vault-stored secret.

## Planned, not yet built

- A "confirm and promote to assessment" action for syllabus items — `syllabus_items` (Phase 6) has its own confirm/dismiss review queue but nothing yet turns a confirmed item into an `assessments` row, which is also why Canvas-vs-syllabus assessment dedup (task 6.9) has no live collision surface to resolve today.
- Block-start reminders (`notifications.kind = 'block_reminder'`) — the schema value has existed since Phase 3 but nothing creates one yet; unlike `deadline` (filled by Phase 11's daily `deadline-reminders` job), a useful block-start reminder needs a much higher-frequency cron (minutes, not once/day) and hasn't been scoped.
- Live end-to-end verification of the Gmail OAuth flow, sync, and draft-push against a real Gmail account — same sandbox limitation as every other browser-auth OAuth flow in this repo (Phase 3/4/5/6 all flagged the same gap); covered instead by unit tests against mocked `fetch` (`src/lib/gmail/client.test.ts`, `sync.test.ts`, `extract.test.ts`) and `tsc`/`eslint`.
- A predicted-vs-actual duration accuracy view (Phase 6 task 6.8) — no completed school tasks have logged actual time yet in the live account, so there's nothing real to chart.
- Live end-to-end verification of real AI extraction/chat/embeddings against Gemini — every adapter method and prompt is wired and unit-tested against mocked `fetch` (`src/ai/providers/gemini.test.ts`), but no one has run any of it against a real `GEMINI_API_KEY` yet to confirm output quality (2026-07-21's `supabase db query`-level pgvector-format check confirmed Postgres accepts the fixed `toPgVector` output, but not a full live `embedText()` → save round trip through the actual chat UI); same "unverified beyond mocks" caveat every OAuth-gated phase has flagged, applied here to the AI call itself.
- Real per-token model streaming, conversation rename in the chat UI, and auto-indexing documents into `document_chunks` on upload — all deliberately deferred; see `docs/PHASES/phase-8.md`'s Notes for why.
- 9D-3 (Gmail room theming) is stale in `PLAN.md`/`phase-9d.md`'s original room map — Gmail moved from a full room to a small ambient mailbox object (room map v2) before 9D-3 was ever started, so it has no remaining work of its own; 9D-4 (Recruiting/office) and 9D-5 (School/nook) are the real open room-visual work, plus 9D-6 (companion redesign).

Keep this section truthful, not aspirational, as each phase lands.
