# Data Classification

Every table/data type GYST stores falls into one of three tiers. This drives encryption, RLS strictness, AI-context inclusion, retention, and export/delete requirements (see `PLAN.md` sections 6, 11, 14). When adding a new table, add a row here before writing the migration.

## Tiers

- **Ordinary** — low sensitivity if leaked; standard RLS is sufficient; safe to include in general AI/chat context.
- **Private** — personal but not medically/financially dangerous if leaked; standard RLS required; included in AI context only when relevant to the user's request.
- **Highly sensitive** — real harm if leaked or misused (health, credentials, tokens, cycle data); requires RLS **and** application-layer encryption and/or exclusion from default AI context; explicit export/delete controls required.

## Classification table

| Data / table | Tier | Notes |
|---|---|---|
| `profiles`, `preferences` | Ordinary | Basic identity/settings. |
| `inbox_items`, `tasks`, `projects`, `goals` | Ordinary | User-authored planning content. |
| `task_dependencies`, `time_block_suggestions`, `daily_plans` | Ordinary | Derived scheduling data. |
| `events` (calendar) | Private | Reveals location/schedule patterns; treat with normal care. |
| `check_ins` (general mood/energy) | Private | Personal but not medical-grade. |
| `job_sources`, `companies`, `opportunities`, `job_scores` | Ordinary | Public/aggregated recruiting data. |
| `applications`, `application_events` | Private | Reveals job search activity and outcomes. |
| `contacts`, `interactions` | Private | Third-party personal info (names, relationships, notes). |
| `documents` (resume, transcript, cover letter, syllabus, job description) | Private | May contain personal history; transcripts lean sensitive. |
| `drafts` (cover letters, recruiter messages) | Private | Never sent automatically; still personal. |
| `recruiting_insights` | Ordinary | Aggregated metrics/hypotheses. |
| `courses`, `assignments`, `assessments`, `syllabus_items`, `work_estimates`, `milestone_suggestions` | Ordinary | Academic scheduling data. Course calendar entries (exams, office hours) reuse the `events` table (Private tier above) rather than a separate `course_events` table. |
| `wellness_check_ins`, `wellness_goals` | Private | Subjective, user-authored; not diagnostic. |
| `health_daily_summaries` (HealthKit aggregates) | Highly sensitive | Health data; exclude from default AI context (`PLAN.md` §11, §14). |
| `cycle_observations` | Highly sensitive | Menstrual-cycle data; separate permissions, explicit deletion controls, opt-in fields only. |
| `conversations`, `messages` | Private | May reference any other tier by content; treat conversation content at the level of what it discusses. |
| `memory_items`, `memory_links` | Private (default); excludes highly sensitive by policy | Health, academic records, email bodies, and credentials are excluded from automatic memory per `PLAN.md` §12. |
| `assistant_actions` | Ordinary | Action previews/execution logs; avoid logging highly sensitive payloads verbatim. |
| `oauth_tokens` | Highly sensitive | Encrypted, server-only, never readable by the browser. |
| `integrations`, `sync_runs` | Ordinary | Operational metadata (status, cursors, error state), not the underlying content. |
| `gmail_items` (Phase 7) | Highly sensitive | Email content; `excerpt_encrypted` is AES-256-GCM (same as `oauth_tokens`), `expires_at` enforces narrow retention (default 30 days), never the full message body. |
| `gmail_drafts` (Phase 7) | Private | App-authored reply content, not raw email; never sent automatically — the user always sends from Gmail itself. |
| `gmail_processed_messages` (Phase 7) | Ordinary | Just a message ID and timestamp, no content — sync bookkeeping only. |
| Canvas personal access token | Highly sensitive | Credential; lives only in server-side env vars (`CANVAS_PERSONAL_ACCESS_TOKEN`), never in the database or browser — no per-user OAuth flow exists for it, so there's no `oauth_tokens` row to encrypt. |
| `document_chunks` (Phase 8) | Private | Extracted text + embeddings of the same documents that back them; mirrors `documents`' tier — chunk content is plaintext (Private tier doesn't require encryption), RLS-scoped. |
| `ai_usage_events` (Phase 8) | Ordinary | Token counts and feature/provider labels only, no message content. |

Chat/memory tables from `PLAN.md` §6 (`conversations`, `messages`, `memory_items`, `memory_links`, `assistant_actions`) are classified in the table above alongside the other Phase-0-anticipated rows. Phase 8's read-tool registry (`src/lib/chat/tools/`) never exposes `check_ins` or any future wellness/health table by construction — `registerTool()` throws if a tool declares `dataTier: "highly_sensitive"` — so health data is excluded from chat by omission today and by an enforced guard once Phase 9 adds real health tables.

## Cross-cutting rules

- RLS is enabled on every user-owned table regardless of tier.
- Only Highly sensitive tiers get mandatory application-layer encryption in addition to RLS.
- Health and wellness data (`health_daily_summaries`, `cycle_observations`) is excluded from general assistant retrieval unless explicitly attached to a question.
- Credentials and provider tokens never reach browser-side code, regardless of tier.
- Export and deletion must cover every tier; Highly sensitive tiers need a dedicated, easy-to-find delete/emergency-stop control.
