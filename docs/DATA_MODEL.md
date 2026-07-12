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
| `preferences` | **Implemented.** Working hours, buffer minutes, notification rules (jsonb — now holds `push_enabled`/`quiet_hours_start`/`quiet_hours_end`, Phase 3), AI daily token/dollar limits, theme. One row per profile, seeded automatically by a trigger on `profiles` insert. RLS: `auth.uid() = id`. See `supabase/migrations/20260712010001_core_schema.sql`. |
| `integrations` | **Implemented.** Provider (`google`), status, granted scopes (text[]), account email, `settings` jsonb (`fixed_calendar_ids`, `gyst_calendar_id`, per-calendar `sync_tokens`), last sync, error state. One row per provider per user. RLS: `auth.uid() = user_id`. See `supabase/migrations/20260712070001_google_calendar_and_notifications.sql`. |
| `oauth_tokens` | **Implemented.** Encrypted (AES-256-GCM), server-only provider tokens; never read from client code, RLS scoped by owner as defense in depth. |
| `sync_runs` | **Implemented.** Provider, start/end, aggregate counts, error, retry count — an audit log. Per-calendar incremental cursors live in `integrations.settings.sync_tokens` instead (Google issues one syncToken per calendar, not per account); see `docs/PHASES/phase-3.md` Notes. |

## Organization

| Table | Purpose |
|---|---|
| `inbox_items` | **Implemented.** Raw capture, `status` (`inbox`/`converted`/`archived`), `source` (default `manual`), and `converted_to`/`converted_id` provenance once manually converted. RLS: `auth.uid() = user_id`. |
| `tasks` | **Implemented.** Title, notes, area, `status` (`not_started`/`in_progress`/`completed`), priority, estimated minutes, energy, due date, earliest start, source, `source_inbox_item_id` provenance, optional `project_id`/`goal_id`, rollover count. RLS: `auth.uid() = user_id`. |
| `task_dependencies` | Blocking relationships between tasks. |
| `projects` | **Implemented.** Title, description, area, status, target date. RLS: `auth.uid() = user_id`. |
| `goals` | **Implemented.** Title, horizon, success definition, progress type, target date, status. RLS: `auth.uid() = user_id`. |
| `events` | **Implemented.** Title, `kind` (`fixed`/`flexible`), start/end, all-day flag, location, time zone, Google calendar ID, `is_fixed_commitment` (feeds the scheduler alongside `recurring_schedules`), `source`/`source_id` (unique per user+source, so re-syncing never duplicates), `recurring_source_id` for expanded recurring instances. RLS: `auth.uid() = user_id`. |
| `time_block_suggestions` | **Implemented** (Phase 2) + `google_event_id` (Phase 3): set when an accepted block is written to the dedicated GYST calendar; cleared on undo. Task, proposed interval, score, status, explanation. |
| `daily_plans` | Capacity, top outcomes, mode, accepted version. |
| `check_ins` | Mood, energy, stress, sleep perception, optional note. |

## Recruiting

| Table | Purpose |
|---|---|
| `job_sources` | Source type, URL/feed config, health, last fetch. |
| `companies` | Name, domain, size/category when known. |
| `opportunities` | Normalized role, company, location, description, dates, URL, source, fingerprint, active state. |
| `job_scores` | Eligibility, role fit, company fit, experience fit, deadline urgency, explanation, score version. |
| `applications` | Stage, submitted date, deadline, resume version, notes, next action. |
| `application_events` | Immutable stage history. |
| `contacts` | Person, company, role, relationship, last/next contact. |
| `interactions` | Meeting/message notes and follow-up date. |
| `documents` | Resume, transcript, cover letter, job description, syllabus, or general reference. |
| `drafts` | Cover letter / recruiter message / application response with source references and approval status. |
| `recruiting_insights` | Funnel metrics and rejection patterns; label AI interpretations as hypotheses. |

Application stages: `discovered → saved → preparing → ready → applied → assessment → recruiter screen → interview → final round → offer / rejected / withdrawn → archived`.

## School

| Table | Purpose |
|---|---|
| `courses` | Term, title, code, Canvas ID, instructor. |
| `assignments` | Course, Canvas ID, due date, points, submission state, source URL. |
| `assessments` | Course, type (quiz/midterm/final/presentation/project/other), scheduled date, location, coverage, preparation status, source, confidence. |
| `course_events` | Exams, office hours, lectures, sections. |
| `syllabus_items` | Extracted policies, major dates, confidence, source page. |
| `work_estimates` | Predicted minutes, actual minutes, estimator version. |

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
