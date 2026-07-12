# Phase 2 — Today, week, and realistic planning

Goal: turn commitments into a manageable day. Source: `PLAN.md` §5, §6, §7.

## Checklist

- [x] Build Today and Week views.
- [x] Add manual recurring class and fencing schedules first.
- [x] Add daily check-in and capacity setting.
- [ ] Implement deterministic free-time and task-scoring engine.
- [ ] Display editable time-block suggestions.
- [ ] Implement rollover review instead of silent backlog growth.
- [ ] Build Overwhelm Mode.
- [ ] Add top-three outcomes and weekly goals.
- [ ] Add calm gamification and return-after-absence rewards.
- [ ] Unit-test daylight-saving changes, overlapping events, zero-capacity days, and overdue tasks.

## Notes

- No `events`, `check_ins`, or `daily_plans` tables exist yet (see `PLAN.md` §6). The Today/Week task uses only the existing `tasks` table (`due_date`) plus `profiles.timezone`; later tasks in this phase add the remaining schema as needed.
- Today screen's fixed timeline, proposed time blocks, and top-three outcomes (PLAN.md §5) depend on later checklist items (events, scheduling engine, daily plans) and are intentionally out of scope for the first task.

## Exit criteria

> The app produces a feasible day and handles missed tasks without creating shame or schedule collisions.
