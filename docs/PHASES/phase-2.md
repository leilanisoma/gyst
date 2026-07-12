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
- [x] Add top-three outcomes and weekly goals.
- [x] Add calm gamification and return-after-absence rewards.
- [x] Unit-test daylight-saving changes, overlapping events, zero-capacity days, and overdue tasks.

## Notes

- No `events`, `check_ins`, or `daily_plans` tables exist yet (see `PLAN.md` §6). The Today/Week task uses only the existing `tasks` table (`due_date`) plus `profiles.timezone`; later tasks in this phase add the remaining schema as needed.
- Today screen's fixed timeline, proposed time blocks, and top-three outcomes (PLAN.md §5) depend on later checklist items (events, scheduling engine, daily plans) and are intentionally out of scope for the first task.
- PLAN.md §7's rollover actions include "delegate," which doesn't apply to a single-user app (CLAUDE.md). The review flow instead offers reduce scope / break down (opens the task edit sheet) / reschedule / delete. "Next feasible slot" is a next-calendar-day heuristic in v1, not a full re-run of the scheduling engine against real free time — a reasonable follow-up once Phase 3 calendar sync exists.
- Overwhelm Mode is advisory only: it reads open tasks and shows a plan (one urgent + one small life-maintenance + one self-care task, everything else visibly listed as "set aside," never silently touched), but doesn't write anything back to the database. "Review queue" is this on-screen list, not a persisted table — nothing needed carrying across sessions since the underlying tasks are untouched and still visible in Tasks/Today.
- `daily_plans` (PLAN.md §6) is scoped to just the three outcome columns this task needs. "Mode" and "accepted version" are in PLAN's data model but unused by anything built so far — add them when a real feature needs them, not speculatively. Weekly goals reuse the existing `goals` table (`horizon = 'weekly'`) rather than new schema; the Today page only surfaces them read-only — goal creation/editing UI is still just inbox conversion from Phase 1.
- Gamification (PLAN.md §13) is an append-only `xp_events` ledger — capture, check-in, saving outcomes, accepting a block, finishing a task, and reviewing an overdue item each award a small, flat XP amount, capped at once per event type per day so re-editing something can't farm XP. A return-after-absence bonus fires once, the first time engagement resumes after a 7+ day gap. Event dates use UTC (`YYYY-MM-DD`), not the user's timezone — acceptable fuzziness near midnight for a low-stakes feature that would otherwise need a timezone fetch in every action. No levels, unlocks, or quests yet — PLAN.md calls those "optional," and the companion-character/decoration visuals are intentionally deferred to Phase 6B (`docs/DECISIONS/0002`). `deleteTask`/`reduceTaskScope` currently always log "review_overdue" since they're only ever called from the rollover review UI; revisit if either action gets a second caller.
- Writing the DST unit tests (spring-forward 2026-03-08, fall-back 2026-11-01) surfaced a real bug in `getLocalTimeUtc` (`src/lib/date-range.ts`): it derived the UTC offset once from `reference` and reused it for the target instant, which is wrong whenever a transition falls between the two (e.g. `reference` at midday, target local midnight earlier that same day, on the spring-forward date — off by exactly the 1-hour transition). Fixed with a guess-then-refine offset calculation; covered by both a `date-range.test.ts` test asserting the day is exactly 23/25 hours long, and a `scheduling.test.ts` test asserting `buildFreeIntervals` reflects that true span rather than a naive 24 hours. Overlapping fixed commitments, zero-capacity days, and overdue-task bucketing already had coverage from earlier tasks (`scheduling.test.ts`, `today.test.ts`, `rollover.test.ts`).

## Exit criteria

> The app produces a feasible day and handles missed tasks without creating shame or schedule collisions.
