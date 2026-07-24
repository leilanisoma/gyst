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
- [x] Add PWA manifest, icons, install instructions, and offline shell.

## Notes

- AI provider is still undecided (`docs/DECISIONS/0001-phase-0-foundational-decisions.md`). The AI-extraction task builds the provider-neutral `AIClient` interface and feature-flagged UI, but ships with the flag **off** — no real model calls until a provider is chosen.
- Supabase project already exists (confirmed during this phase); credentials live in `.env.local` only.
- PLAN.md §5's global nav doesn't list a "Tasks" destination (the Kanban board is described as reachable via filters from Today). Added a top-level "Tasks" nav item in Phase 1 since the board needed a home before Today (Phase 2) exists to filter into it. Revisit whether it stays a separate nav item once Today ships.
- **2026-07-23: direct task creation, deliberately bypassing Inbox.** Every task-list surface (`/tasks`, Today's "Due today", School's board) got a "+ Add task" form (`createTask`, `src/app/(app)/tasks/actions.ts`; `AddTaskForm`, `src/components/tasks/add-task-form.tsx`) that inserts straight into `tasks` — no `inbox_items` row at all. This is an intentional narrowing of Inbox's role, decided with Ishani when she was confused about what Inbox was even for: Inbox stays the "I don't know what this is yet" capture buffer (task/note/goal, manual or AI-split); a button sitting directly on a task list already knows its output is a task, so routing it through Inbox first would just be indirection. Today's form defaults its due date to "today" (`bucketTodayTasks` only shows dated tasks, so an undated add would silently vanish from that list); `/tasks` and School default to no due date. School's form additionally offers a class picker (new `tasks.course_id`, migration `20260723000002_tasks_course_id.sql`) sourced from the same `courses` list already used for syllabus uploads — `TaskCard` shows the joined course title as a badge when present. Caught and fixed two real bugs via live Playwright verification, not just code review: a Base UI `Select` warning from letting the class picker's value go from `undefined` to a real string (fixed by initializing it as `""` and always passing it, matching `draft-form.tsx`'s existing resume-picker pattern instead of introducing a new `?? undefined` variant); and a genuine hydration mismatch from `@dnd-kit`'s `DndContext` auto-assigning accessibility IDs from a module-level counter that drifts between server/client render passes once `TaskBoard` mounts twice on one page (School's desktop-tab-rail copy and mobile-accordion-fallback copy render simultaneously) — fixed with `DndContext`'s own `id` prop, threaded through as `TaskBoard`'s new `instanceId`.

## Exit criteria

> From Mac and iPhone, a thought can be captured in under five seconds and safely converted into tasks.
