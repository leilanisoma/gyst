# GYST (Get Your Shit Together)

A private, single-user personal command center for tasks, recruiting, school, and wellness. See [`PLAN.md`](./PLAN.md) for the full product and build plan, and [`docs/`](./docs) for architecture, data model, and decision records.

## Status

Phase 0 (decisions and foundation) is in progress. No application code exists yet — that begins in Phase 1. See [`docs/PHASES/phase-0.md`](./docs/PHASES/phase-0.md) for the current checklist.

## Setup

1. Copy `.env.example` to `.env.local` and fill in real values as they become available. Never commit `.env.local`.
2. Cloud projects (Supabase, Vercel) are created manually through their dashboards — see `docs/PHASES/phase-0.md`.
3. Application scaffolding (Next.js, Tailwind, etc.) is not yet created; it lands in Phase 1.

## Repository documents

- `PLAN.md` — stable product direction and phased build plan.
- `CLAUDE.md` — commands, architecture rules, security boundaries, and definition of done for AI-assisted coding sessions.
- `docs/PRODUCT_BRIEF.md` — one-page summary of vision, outcomes, and design principles.
- `docs/DATA_CLASSIFICATION.md` — ordinary / private / highly sensitive data table.
- `docs/ARCHITECTURE.md` — current architecture (updated as code lands; not speculation).
- `docs/DATA_MODEL.md` — planned schema, kept in sync with actual migrations once they exist.
- `docs/DECISIONS/` — short architecture decision records (ADRs).
- `docs/PHASES/` — one file per phase with only that phase's active tasks and acceptance criteria.
