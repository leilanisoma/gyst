# Phase 2 — Today, week, and realistic planning

Goal: turn commitments into a manageable day. Source: `PLAN.md` §5, §6, §7.

## Checklist

- [x] Build Today and Week views.
- [x] Add manual recurring class and fencing schedules first.
- [x] Add daily check-in and capacity setting.
- [x] Implement deterministic free-time and task-scoring engine.
- [x] Display editable time-block suggestions.
- [x] Implement rollover review instead of silent backlog growth.
- [x] Build Overwhelm Mode.
- [ ] Add top-three outcomes and weekly goals.
- [ ] Add calm gamification and return-after-absence rewards.
- [ ] Unit-test daylight-saving changes, overlapping events, zero-capacity days, and overdue tasks.

## Notes

- No `events`, `check_ins`, or `daily_plans` tables exist yet (see `PLAN.md` §6). The Today/Week task uses only the existing `tasks` table (`due_date`) plus `profiles.timezone`; later tasks in this phase add the remaining schema as needed.
- Today screen's fixed timeline, proposed time blocks, and top-three outcomes (PLAN.md §5) depend on later checklist items (events, scheduling engine, daily plans) and are intentionally out of scope for the first task.
- PLAN.md §7's rollover actions include "delegate," which doesn't apply to a single-user app (CLAUDE.md). The review flow instead offers reduce scope / break down (opens the task edit sheet) / reschedule / delete. "Next feasible slot" is a next-calendar-day heuristic in v1, not a full re-run of the scheduling engine against real free time — a reasonable follow-up once Phase 3 calendar sync exists.
- Overwhelm Mode is advisory only: it reads open tasks and shows a plan (one urgent + one small life-maintenance + one self-care task, everything else visibly listed as "set aside," never silently touched), but doesn't write anything back to the database. "Review queue" is this on-screen list, not a persisted table — nothing needed carrying across sessions since the underlying tasks are untouched and still visible in Tasks/Today.

## Exit criteria

> The app produces a feasible day and handles missed tasks without creating shame or schedule collisions.
