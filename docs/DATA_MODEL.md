# Data Model

This is the **planned** schema (from `PLAN.md` §6). Tables marked **Implemented** below reflect actual migrations in `supabase/migrations/`; everything else is still aspirational.

## Conventions (apply to every table once built)

- UUID primary keys.
- `created_at`, `updated_at`, optional `deleted_at` on every table.
- `source` / `source_id` on any entity synced from an external system.
- Times stored in UTC; retain the source timezone separately when relevant.
- RLS enabled on every user-owned table (see `docs/DATA_CLASSIFICATION.md`).

## Identity and settings

| Table | Purpose |
|---|---|
| `profiles` | **Implemented.** User identity, email, timezone. One row, created by a DB trigger on `auth.users` insert. The trigger rejects sign-ups for any email other than `ALLOWED_USER_EMAIL`; the app's proxy (`src/lib/supabase/middleware.ts`) enforces the same allowlist as a second layer. RLS: a user can only select/update the row where `auth.uid() = id`. See `supabase/migrations/20260712000001_profiles.sql`. |
| `preferences` | **Implemented.** Working hours, buffer minutes, notification rules (jsonb — now holds `push_enabled`/`quiet_hours_start`/`quiet_hours_end`, Phase 3), `recruiting_preferences` jsonb (Phase 4 — currently just `target_grad_year`, used by the job-scoring eligibility dimension), AI daily token/dollar limits, theme. One row per profile, seeded automatically by a trigger on `profiles` insert. RLS: `auth.uid() = id`. See `supabase/migrations/20260712010001_core_schema.sql`. |
| `integrations` | **Implemented.** Provider (`google`, `canvas` since Phase 6), status, granted scopes (text[]), account email, `settings` jsonb (`fixed_calendar_ids`, `gyst_calendar_id`, per-calendar `sync_tokens`), last sync, error state. One row per provider per user. RLS: `auth.uid() = user_id`. See `supabase/migrations/20260712070001_google_calendar_and_notifications.sql`. |
| `oauth_tokens` | **Implemented.** Encrypted (AES-256-GCM), server-only provider tokens; never read from client code, RLS scoped by owner as defense in depth. |
| `sync_runs` | **Implemented.** Provider (`google`, `canvas` since Phase 6), start/end, aggregate counts, error, retry count — an audit log. Per-calendar incremental cursors live in `integrations.settings.sync_tokens` instead (Google issues one syncToken per calendar, not per account); see `docs/PHASES/phase-3.md` Notes. |

## Organization

| Table | Purpose |
|---|---|
| `inbox_items` | **Implemented.** Raw capture, `status` (`inbox`/`converted`/`archived`), `source` (default `manual`), and `converted_to`/`converted_id` provenance once manually converted. RLS: `auth.uid() = user_id`. |
| `tasks` | **Implemented.** Title, notes, area, `status` (`not_started`/`in_progress`/`completed`), priority, estimated minutes, energy, due date, earliest start, source, `source_inbox_item_id` provenance, optional `project_id`/`goal_id`, rollover count; Phase 6 added `source_assignment_id`/`source_assessment_id` provenance. RLS: `auth.uid() = user_id`. |
| `task_dependencies` | Blocking relationships between tasks. |
| `projects` | **Implemented.** Title, description, area, status, target date. RLS: `auth.uid() = user_id`. |
| `goals` | **Implemented.** Title, horizon, success definition, progress type, target date, status. RLS: `auth.uid() = user_id`. |
| `events` | **Implemented.** Title, `kind` (`fixed`/`flexible`), start/end, all-day flag, location, time zone, Google calendar ID, `is_fixed_commitment` (feeds the scheduler alongside `recurring_schedules`), `source`/`source_id` (unique per user+source, so re-syncing never duplicates; `source` now also allows `"canvas"`, Phase 6), `recurring_source_id` for expanded recurring instances, `course_id` (Phase 6). RLS: `auth.uid() = user_id`. |
| `time_block_suggestions` | **Implemented** (Phase 2) + `google_event_id` (Phase 3): set when an accepted block is written to the dedicated GYST calendar; cleared on undo. Task, proposed interval, score, status, explanation. |
| `daily_plans` | Capacity, top outcomes, mode, accepted version. |
| `check_ins` | Mood, energy, stress, sleep perception, optional note. |

## Recruiting

| Table | Purpose |
|---|---|
| `job_sources` | Not yet built — Phase 5 discovery adapters. |
| `companies` | **Implemented.** Name, domain, size category, established flag (return-offer bonus signal), notes. RLS: `auth.uid() = user_id`. |
| `opportunities` | **Implemented.** Title, location, description, URL, role family, hard-exclusion flags (`is_swe`, `is_finance`), eligible grad years, deadline, source, `fingerprint` (unique per user — dedup on re-paste), active flag. RLS: `auth.uid() = user_id`. |
| `job_scores` | **Implemented.** One row per opportunity (`unique (opportunity_id)`), per-dimension scores matching the PLAN.md §9 100-point breakdown, `excluded`/`exclusion_reason` for hard exclusions, `explanation`, `score_version`. No `user_id` column — ownership (and RLS) is derived through `opportunities`. |
| `applications` | **Implemented.** One per opportunity (`unique (user_id, opportunity_id)`), stage, resume document link, submitted date, notes, `prep_notes` (role/company prep — Phase 4 task 4.9, not a separate product), next action + date. RLS: `auth.uid() = user_id`. |
| `application_events` | **Implemented.** Immutable stage-change log (`from_stage`, `to_stage`, note, `occurred_at`); no `updated_at`/edit path by design. No `user_id` column — ownership derived through `applications`. |
| `contacts` | **Implemented.** Person, company link, role, relationship, email/LinkedIn, last/next contact, notes. RLS: `auth.uid() = user_id`. |
| `interactions` | **Implemented.** Contact + optional application link, kind, summary, `occurred_at`, `follow_up_at`. RLS: `auth.uid() = user_id`. |
| `documents` | **Implemented.** Resume/transcript/cover-letter/writing-sample/job-description/syllabus (Phase 6)/other; `storage_path` points into the private `documents` Storage bucket (object key `<user_id>/<uuid>-<filename>`, RLS-scoped by folder); `course_id` (Phase 6, syllabus uploads only). RLS: `auth.uid() = user_id`. |
| `drafts` | **Implemented.** Cover letter / recruiter message / application response, tied to one `application_id`, `evidence_document_ids`/`unsupported_claims` arrays for the evidence-linked drafting flow (PLAN.md §9), approval status. RLS: `auth.uid() = user_id`. |
| `recruiting_insights` | Not persisted — funnel analytics (Phase 4 task 4.10) are computed live from `applications`/`application_events` rather than materialized, per CLAUDE.md's no-premature-abstraction guidance. Revisit if computation cost ever justifies caching. |

Application stages: `discovered → saved → preparing → ready → applied → assessment → recruiter_screen → interview → final_round → offer / rejected / withdrawn → archived` (matches the `applications.stage` check constraint).

## School

| Table | Purpose |
|---|---|
| `courses` | **Implemented.** Term, title, code, Canvas ID, instructor, active. RLS: `auth.uid() = user_id`. |
| `assignments` | **Implemented.** Course, Canvas ID, due date, points, submission types/state, source URL. RLS: `auth.uid() = user_id`. |
| `assessments` | **Implemented.** Course, optional source `assignment_id`, kind (quiz/midterm/final/presentation/project/other), scheduled date, location, coverage, preparation status, source (manual/canvas/syllabus), confidence, `confirmed`, sticky `dismissed_at`. RLS: `auth.uid() = user_id`. |
| `syllabus_items` | **Implemented.** Course, optional `document_id`, kind (policy/major_date/other), title, description, date, source page, confidence, `confirmed`. RLS: `auth.uid() = user_id`. |
| `work_estimates` | **Implemented.** One per task (`unique(task_id)`), predicted minutes, actual minutes, estimator version. RLS: `auth.uid() = user_id`. |
| `milestone_suggestions` | **Implemented, not in original plan.** Proposed prep checkpoints for one assignment *or* assessment (`unique`-by-source not needed — one-of-two-columns check constraint), title, due date, status (proposed/accepted/dismissed), `created_task_id` once accepted. RLS: `auth.uid() = user_id`. |

**Deviation from the original plan**: no separate `course_events` table — Canvas calendar entries (exams, office hours, lectures) reuse the existing `events` table (Phase 3) via `source: "canvas"` and a new nullable `course_id`, since `events` already modeled the same shape. Syllabus PDF uploads similarly reuse `documents` (Phase 4) via `kind: "syllabus"` and the same new `course_id`, rather than a separate syllabus-file table.

## Wellness

| Table | Purpose | Tier |
|---|---|---|
| `wellness_check_ins` | Subjective sleep, energy, mood, stress, meal-consistency response, note. | Private |
| `health_daily_summaries` | Date, approved aggregate metrics, source, sync time. | Highly sensitive |
| `wellness_goals` | User-authored behavior goals, no medical prescriptions. | Private |
| `cycle_observations` | Only fields explicitly selected by the user; separate permissions and deletion controls. | Highly sensitive |

## Chat and memory

| Table | Purpose |
|---|---|
| `conversations`, `messages` | Chat history. |
| `memory_items` | Fact/preference/goal/decision, text, embedding, confidence, source message, status. |
| `memory_links` | Links memory to tasks, contacts, jobs, courses, or documents. |
| `assistant_actions` | Proposed tool/action, preview, approval state, execution log. |

Health data, academic records, email bodies, and credentials are excluded from automatic memory extraction (see `PLAN.md` §12 and `docs/DATA_CLASSIFICATION.md`).

## Notifications (not in PLAN.md §6 — Phase 3 addition, same precedent as `xp_events` in Phase 2)

| Table | Purpose |
|---|---|
| `notifications` | **Implemented.** In-app notification center: kind (`info`/`sync_error`/`deadline`/`block_reminder`), title, body, link, `read_at`. RLS: `auth.uid() = user_id`. |
| `push_subscriptions` | **Implemented.** One row per browser/device push subscription (endpoint, p256dh, auth keys). Removed automatically when a push send returns 404/410. RLS: `auth.uid() = user_id`. |

## Scheduling engine inputs (not tables, but relied on by the planner)

Fixed calendar events (`recurring_schedules` plus `events` rows synced from Google calendars marked as fixed-commitment sources in Settings — Phase 3), class periods, fencing, travel, meals, sleep window; task deadline/duration/priority/energy/splittability; daily energy check-in and max planned focus time; buffers between commitments; unfinished tasks and rollover history. See `PLAN.md` §7 for the v1 scoring formula and rollover rules.
