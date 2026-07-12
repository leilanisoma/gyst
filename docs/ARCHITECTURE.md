# Architecture

This file describes what **currently exists**. Do not add speculative future architecture here — that belongs in `PLAN.md`. Update this file only when actual code/infrastructure changes.

## Current state (Phase 0)

No application code exists yet. The repository currently contains only planning and decision documents:

```
gyst/
├── PLAN.md                  # product vision and phased build plan (source of truth)
├── CLAUDE.md                # rules for AI-assisted coding sessions
├── README.md
├── .env.example
├── .gitignore
└── docs/
    ├── PRODUCT_BRIEF.md
    ├── DATA_CLASSIFICATION.md
    ├── ARCHITECTURE.md      # this file
    ├── DATA_MODEL.md
    ├── DECISIONS/            # ADRs
    └── PHASES/               # one file per build phase
```

There is no Next.js app, no database, no deployed environment, and no CI yet. "Local skeleton boots" for Phase 0 means the repository is coherent and documented, not that a server runs.

## Planned stack (not yet built — see `PLAN.md` §4 for rationale)

| Layer | Choice |
|---|---|
| Web framework | Next.js App Router + TypeScript |
| Mobile delivery | PWA (installable, no App Store) |
| Styling | Tailwind CSS + shadcn/ui |
| Database | Supabase Postgres |
| Auth | Supabase Auth, single allowed email, RLS on every table |
| File storage | Supabase Storage |
| Semantic memory | Postgres + pgvector |
| Background jobs | Supabase Cron + Edge Functions |
| Deployment | Vercel (app) + Supabase (data) |
| Validation | Zod |
| Testing | Vitest + React Testing Library + Playwright |
| Monitoring | Sentry free tier or structured DB logs |

AI provider is **undecided** (see `docs/DECISIONS/0001-phase-0-foundational-decisions.md`). The provider-neutral `AIClient` interface exists (`src/ai/client.ts`), but `getAIClient()` (`src/ai/index.ts`) always returns `null` until a real adapter is wired in — `isAIExtractionEnabled()` gates any AI-dependent UI (currently just the Inbox's "Extract with AI" action, which stays hidden).

## Planned high-level shape (Phase 1+)

- Single Next.js codebase serves both desktop web and installed-PWA mobile.
- Supabase is the only database; every user-owned table has RLS.
- External integrations (Google Calendar, Gmail, Canvas, job sources) are isolated adapters behind narrow interfaces (e.g. `JobSourceAdapter` in `PLAN.md` §8), never called directly from UI code.
- A deterministic scheduling engine (plain TypeScript, no AI) computes free time and task scores; AI is used only for extraction, classification, summarization, ranking explanations, drafting, and conversation — never for arithmetic or permissions.
- Prompts will live under `src/ai/prompts/` as versioned files, not inline strings.

This section will be replaced with the actual implemented architecture as each phase lands — keep it truthful, not aspirational, once code exists.
