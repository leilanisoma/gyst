# Data Model

This is the **planned** schema (from `PLAN.md` §6), kept here for reference during Phase 0. No migrations exist yet — this file must be updated to match reality as soon as the first migration lands in Phase 1, and from then on this file describes actual tables, not aspirations.

## Conventions (apply to every table once built)

- UUID primary keys.
- `created_at`, `updated_at`, optional `deleted_at` on every table.
- `source` / `source_id` on any entity synced from an external system.
- Times stored in UTC; retain the source timezone separately when relevant.
- RLS enabled on every user-owned table (see `docs/DATA_CLASSIFICATION.md`).

## Identity and settings

| Table | Purpose |
|---|---|
| `profiles` | User identity, timezone, allowed email. |
| `preferences` | Working hours, buffer defaults, notification rules, AI limits, theme. |
| `integrations` | Provider, status, granted scopes, last sync, error state. |
| `oauth_tokens` | Encrypted, server-only provider tokens; never readable by the browser. |
| `sync_runs` | Provider, cursor, start/end, counts, error, retry state. |

## Organization

| Table | Purpose |
|---|---|
| `inbox_items` | Raw capture, parsed status, source, original text. |
| `tasks` | Title, notes, area, status, priority, estimated minutes, energy, due date, earliest start, source, rollover count. |
| `task_dependencies` | Blocking relationships between tasks. |
| `projects` | Goal, area, status, target date. |
| `goals` | Horizon, success definition, progress type. |
| `events` | Fixed/flexible, start/end, location, travel buffer, external calendar ID. |
| `time_block_suggestions` | Task, proposed interval, score, status, explanation. |
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

## Scheduling engine inputs (not tables, but relied on by the planner)

Fixed calendar events, class periods, fencing, travel, meals, sleep window; task deadline/duration/priority/energy/splittability; daily energy check-in and max planned focus time; buffers between commitments; unfinished tasks and rollover history. See `PLAN.md` §7 for the v1 scoring formula and rollover rules.
