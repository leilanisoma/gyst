# Phase 6 — Canvas and school planning

Goal: pull school obligations into the same planning loop. Source:
`PLAN.md` §15 Phase 6, §6, §8.

## Checklist (task IDs map 1:1 to PLAN.md §15 Phase 6 bullets)

- [x] 6.1 Test Canvas personal-token/API access.
- [ ] 6.2 Implement courses, assignments, events, and submission sync.
- [ ] 6.3 Build the Upcoming Assessments section with countdowns, preparation status, and term timeline.
- [ ] 6.4 Extract assessment candidates from Canvas and syllabi and require confirmation for uncertain dates.
- [ ] 6.5 If blocked, implement `.ics` import plus syllabus upload first.
- [ ] 6.6 Add syllabus PDF extraction with source page/confidence review.
- [ ] 6.7 Suggest milestones for major assignments.
- [ ] 6.8 Add duration estimates and actual-time feedback.
- [ ] 6.9 Resolve duplicates between Canvas, syllabus, Gmail, and Calendar.
- [ ] 6.10 Feed school tasks into the universal scheduler.

## Exit criteria

> Current courses and deadlines remain accurate for two weeks with a clear
> fallback when sync fails.

## Notes

- **Canvas personal-access-token access is confirmed working, not blocked** — task 6.5's `.ics`/syllabus fallback is not needed to start 6.2. `src/lib/canvas/client.ts` (`checkCanvasAccess`) is a hand-rolled `fetch` client, matching the existing Google/job-source connector style (no SDK dependency), calling `GET /api/v1/users/self` against `CANVAS_BASE_URL` with `Authorization: Bearer $CANVAS_PERSONAL_ACCESS_TOKEN`. `getCanvasEnv()`/`isCanvasConfigured()` added to `src/lib/env.ts`, same Zod-validated pattern as every other integration's env accessor.
- **Live-verified against the real instance** (`https://canvas.stanford.edu`), not just unit tests: `GET /api/v1/users/self` returned 200 with the correct account, and `GET /api/v1/courses?enrollment_state=active` returned 200 with 2 active-enrollment courses — confirming the token has read access to the courses endpoint that task 6.2's sync will depend on. Both calls were one-off, run through a throwaway script, not committed.
- Unit tests (`src/lib/canvas/client.test.ts`) mock `fetch` and cover success, 401, network failure, and missing-env-var cases — no real token/network needed to run the suite.
- Nothing beyond the connectivity check landed this task — no sync, no `courses`/`assignments` tables yet (that's 6.2), and no UI surfacing the check (Canvas health isn't wired into Settings the way Google's integration card is; revisit if 6.2 wants a visible connection-status card).
