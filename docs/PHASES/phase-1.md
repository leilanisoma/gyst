# Phase 1 — Cozy shell and universal capture

Goal: replace scattered mental notes with one trusted inbox. Source: `PLAN.md` §15, §5, §6.

## Checklist

- [x] Scaffold Next.js, TypeScript, Tailwind, component library, linting, formatting, and tests.
- [x] Implement single-user authentication and RLS.
- [x] Build responsive navigation and cozy design tokens.
- [x] Create Inbox, tasks, projects, goals, and settings schema.
- [x] Build instant raw brain-dump capture.
- [x] Add deterministic manual conversion from inbox item to task/note/goal.
- [x] Add AI extraction behind a feature flag with confirmation UI.
- [x] Build task list, quick edit, due date, duration, status, and area.
- [x] Build the draggable Kanban board with Not Started, In Progress, and Completed columns, plus keyboard/mobile status controls.
- [ ] Add PWA manifest, icons, install instructions, and offline shell.

## Notes

- AI provider is still undecided (`docs/DECISIONS/0001-phase-0-foundational-decisions.md`). The AI-extraction task builds the provider-neutral `AIClient` interface and feature-flagged UI, but ships with the flag **off** — no real model calls until a provider is chosen.
- Supabase project already exists (confirmed during this phase); credentials live in `.env.local` only.
- PLAN.md §5's global nav doesn't list a "Tasks" destination (the Kanban board is described as reachable via filters from Today). Added a top-level "Tasks" nav item in Phase 1 since the board needed a home before Today (Phase 2) exists to filter into it. Revisit whether it stays a separate nav item once Today ships.

## Exit criteria

> From Mac and iPhone, a thought can be captured in under five seconds and safely converted into tasks.
