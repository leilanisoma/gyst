# Architecture

This file describes what **currently exists**. Do not add speculative future architecture here — that belongs in `PLAN.md`. Update this file only when actual code/infrastructure changes.

## Current state (Phase 3 complete)

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
│   │   │   └── recruiting|school|wellness|chat/  # stub pages
│   │   ├── api/google/       # connect/callback route handlers (OAuth redirect + code exchange)
│   │   ├── login/            # magic-link sign-in
│   │   ├── auth/callback/    # PKCE code exchange
│   │   ├── auth/error/
│   │   ├── offline/          # service-worker fallback page (inline-styled, no deps)
│   │   ├── manifest.ts       # PWA manifest
│   │   ├── icon*.tsx, apple-icon.tsx, icon-*/route.tsx  # generated icons
│   │   └── layout.tsx        # root layout, metadata, service worker registration
│   ├── proxy.ts              # auth guard + session refresh (Next 16 "proxy", was middleware)
│   ├── ai/                   # provider-neutral AIClient; getAIClient() returns null (no provider chosen yet)
│   ├── components/
│   │   ├── nav/              # sidebar (desktop) + drawer (mobile) + notification bell
│   │   ├── capture/          # brain-dump capture form
│   │   ├── tasks/             # Kanban board, card, quick-edit sheet
│   │   ├── today/              # timeline, check-in, suggestions, overwhelm, outcomes, xp
│   │   ├── settings/            # Google integration card, notification settings, recurring schedule
│   │   ├── ai/                # AI-extraction confirmation dialog
│   │   ├── pwa/                # install instructions, SW registration
│   │   └── ui/                 # shadcn/ui primitives (Base UI-backed)
│   └── lib/
│       ├── supabase/          # browser/server clients, proxy helper, generated DB types
│       ├── google/             # oauth, calendar (fetch-based REST client), tokens (encrypted),
│       │                       # integration (settings/status bookkeeping), sync, normalize, blocks
│       ├── crypto.ts            # AES-256-GCM encrypt/decrypt for oauth_tokens
│       ├── notifications.ts     # create notification + best-effort push fan-out
│       ├── webpush.ts            # VAPID-signed push send (wraps the `web-push` package)
│       ├── quiet-hours.ts        # local wall-clock quiet-hours check
│       ├── timeline.ts            # merges synced events + recurring schedules for Today
│       ├── tasks.ts            # task status/priority/area constants
│       └── env.ts               # Zod-validated env access (Google, encryption, VAPID added Phase 3)
├── supabase/migrations/         # profiles, preferences, inbox_items, tasks, projects, goals, ...,
│                                 # integrations, oauth_tokens, sync_runs, events, notifications, push_subscriptions
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

AI provider is **undecided** (see `docs/DECISIONS/0001-phase-0-foundational-decisions.md`). The provider-neutral `AIClient` interface exists (`src/ai/client.ts`), but `getAIClient()` (`src/ai/index.ts`) always returns `null` until a real adapter is wired in — `isAIExtractionEnabled()` gates the Inbox's "Extract with AI" action, which stays hidden until then.

## Notable decisions from Phase 1

- **IA gap:** PLAN.md §5's nav doesn't list "Tasks" (the board is meant to be reachable via Today's filters, which don't exist until Phase 2). Added it as a top-level nav item so the board has a home; revisit once Today ships.
- **Note conversion has no destination table.** PLAN.md §6 doesn't define a `notes` table. Converting an inbox item "to a note" just marks it `converted`/`converted_to: 'note'` with no `converted_id` — the text stays in `inbox_items.raw_text`.
- **Migrations run via the Supabase CLI against the transaction pooler** (`aws-1-<region>.pooler.supabase.com:6543`), not the direct `db.<ref>.supabase.co` host — this sandbox has no outbound IPv6, and the direct host is IPv6-only on this project.

## Notable decisions from Phase 3

See `docs/PHASES/phase-3.md`'s Notes section for the full list (scope choices, sync-cursor storage, write-back timing, etc.). Highlights: OAuth/Calendar API access is hand-rolled over `fetch` rather than the `googleapis` SDK; write scope uses the narrow `calendar.app.created` grant so "write only to a dedicated GYST calendar" is enforced by Google, not just app logic; `notifications`/`push_subscriptions` are pragmatic additions beyond PLAN.md §6, same precedent as Phase 2's `xp_events`.

## Planned, not yet built

- Gmail, Canvas, and job-source adapters (`JobSourceAdapter` in `PLAN.md` §8) — Phase 5+.
- File storage, pgvector semantic memory, background jobs (Supabase Cron/Edge Functions) — later phases, per `PLAN.md` §4. Scheduled/automatic notifications (deadline reminders, block reminders) need this; only the connector-error path sends one today.
- Prompts as versioned files under `src/ai/prompts/` — once a provider exists to use them.

Keep this section truthful, not aspirational, as each phase lands.
