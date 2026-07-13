# Phase 6 — Canvas and school planning

Goal: pull school obligations into the same planning loop. Source:
`PLAN.md` §15 Phase 6, §6, §8.

## Checklist (task IDs map 1:1 to PLAN.md §15 Phase 6 bullets)

- [x] 6.1 Test Canvas personal-token/API access.
- [x] 6.2 Implement courses, assignments, events, and submission sync.
- [ ] 6.3 Build the Upcoming Assessments section with countdowns, preparation status, and term timeline.
- [x] 6.4 Extract assessment candidates from Canvas and syllabi and require confirmation for uncertain dates. (Canvas half only — syllabi half is 6.6, AI-gated.)
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

### 6.2 notes

- **`runCanvasSync` (`src/lib/canvas/sync.ts`) mirrors `runGoogleSync`'s exact shape** (Phase 3): one `sync_runs` row per pass (`provider: "canvas"`), courses/assignments/events upserted by their Canvas ID so re-running never duplicates, and `integrations` (`provider: "canvas"`) tracks `status`/`last_synced_at`/`error` the same way Google's does — including the same "sync failure creates a `sync_error` notification" behavior (`src/lib/canvas/integration.ts`), satisfying the exit criteria's "clear fallback when sync fails."
- **Course calendar events reuse the existing `events` table** (`source: "canvas"`, new nullable `course_id`) instead of a separate `course_events` table from PLAN.md's original data model — `events` already models exactly this shape, and reusing it means Canvas entries automatically show up on Today's timeline and become directly comparable to Google Calendar events for task 6.9's dedup. Documented as a deliberate divergence from `DATA_MODEL.md`'s original per-domain table list.
- **Task 6.10 (feed school tasks into the universal scheduler) turned out to need zero scheduler code changes.** `generateTimeBlockSuggestions` (`src/app/(app)/actions.ts`) already selects every incomplete `tasks` row regardless of `area` — so `runCanvasSync` just upserts a mirrored `tasks` row (`area: "school"`, `source: "canvas"`, linked via new `source_assignment_id`) for every non-submitted assignment, and it flows into the scheduler automatically. A submitted assignment's task is marked `completed` on the next sync rather than deleted, matching how the rest of the app treats history.
- **Task 6.8's predicted-minutes half landed here too** (`src/lib/canvas/estimate.ts`) — a deterministic estimator (10 min/point, clamped 30–240; submission-type defaults when Canvas reports no points) writes both `tasks.estimated_minutes` and a `work_estimates` row (`estimator_version: "v1"`) at sync time, since that's the natural point where a task is first created. 6.8's own task adds the actual-time-logging half (`work_estimates.actual_minutes`), not this one.
- **`src/lib/test/fake-supabase.ts`** — moved from `job-sources/fixtures/` (was job-sources-only) to a shared location and taught it `.upsert()` (match-by-`onConflict`-columns, else insert), since `runCanvasSync`'s tests need it and it was already framework-agnostic in spirit. `run-discovery.test.ts`/`ingest.test.ts` updated to the new import path; both still pass unchanged otherwise.
- **Live-verified against the real Supabase project and the real Canvas account** (not fixtures): ran `/api/cron/sync-canvas` twice through the dev server. First run created 2 courses and 1 assignment (a graded quiz, correctly `submitted: true` with no mirrored task); second run produced identical row counts, confirming upsert idempotency. This is real production data for the account, not seeded/cleaned-up test data — it's exactly what the School page is meant to show.
- **School page** (`src/app/(app)/school/page.tsx`) replaces the `ComingSoon` stub with a Canvas sync status card (`CanvasSyncCard`, manual "Sync now" button) and a courses/open-assignments list (`CoursesSection`). Not verified in an authenticated browser session — same sandbox limitation Phase 4/5 flagged (no magic-link login here) — verified instead via `tsc`/`eslint` and the live data shape confirmed above.

### 6.4 notes

- **`classifyAssessmentCandidate` (`src/lib/canvas/assessment-candidates.ts`) is deterministic keyword/points matching**, same word-boundary-aware precedent as `job-sources/classify.ts` (catches "Examine"/"Example" not matching `\bexam\b`, "Finalize" not matching `\bfinal\b`). A title match (midterm/exam/final/presentation/project/quiz) alone is enough to flag a candidate; confidence is 0.9 with `points_possible >= 20`, else 0.7. A large (`>= 100` point) assignment with no keyword match still gets flagged as a low-confidence (`0.5`) `"other"` candidate. Everything still requires explicit confirmation — this only decides what's worth *asking about* (PLAN.md's suggestions-not-silent-actions principle).
- **This is only the Canvas half of task 6.4.** The syllabus half (extracting candidates from syllabus text) needs AI extraction and lands in 6.6 instead, since that's genuinely blocked on a provider decision — this half isn't (it's ordinary code).
- **Confirmation is sticky across re-syncs.** A new `dismissed_at` column (`20260712120001_assessment_candidates.sql`) plus a plain `unique(user_id, assignment_id)` constraint mean `runCanvasSync` only ever inserts a candidate once per assignment and never touches `confirmed`/`dismissed_at` again — a daily cron re-sync can't resurrect something already reviewed. `src/app/(app)/school/assessment-actions.ts` (`confirmAssessmentCandidate`, `dismissAssessmentCandidate`) are the only two writers of those columns.
- **Review UI**: `AssessmentReviewQueue` (`src/components/school/assessment-review-queue.tsx`) lists unconfirmed, non-dismissed candidates with Confirm/Dismiss buttons, wired into the School page above the courses list.
- **Live-verified against the real Supabase project**: re-ran `/api/cron/sync-canvas` — 0 new candidates, correctly, since the only real assignment in the account (a graded quiz) is already submitted and skipped before candidate generation runs. Separately verified the confirm/dismiss DB update paths directly (insert an unconfirmed candidate → confirm → dismiss → delete), since no real unconfirmed exam-shaped assignment exists yet in the live account to exercise the review queue naturally; the synthetic row was deleted after.
