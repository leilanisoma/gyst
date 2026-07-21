# Get Your Shit Together (GYST) - Product and Build Plan

## 1. Product vision

GYST is a private, cozy personal command center that gets commitments, worries, deadlines, opportunities, and half-formed thoughts out of Ishani's head and turns them into a realistic daily plan.

It combines four urgent areas without forcing equal attention every day:

1. **Today** - one calm view of what matters now.
2. **Recruiting** - relevant summer 2027 opportunities, application tracking, networking, and tailored preparation.
3. **School** - Canvas deadlines, syllabus ingestion, workload estimates, and plans that respect class and fencing schedules.
4. **Wellness** - lightweight check-ins plus Apple Watch/Health context, designed around consistency and recovery rather than punishment.

The product should feel like a calm assistant when anxiety is high, a command center when planning, a coach when momentum is low, and an accountability partner that never shames missed tasks.

This is a single-user personal project. Optimize for usefulness, low maintenance, low cost, privacy, and fun - not multi-user scale or startup architecture.

## 2. Outcomes and non-goals

### Desired outcomes

- Everything can enter through one fast brain-dump inbox.
- Every morning, the app proposes a feasible day around calendar events, class, fencing, energy, and deadlines.
- Overdue work rolls forward intelligently without creating an impossible backlog.
- An "I'm overwhelmed" action produces a minimum viable day in one tap.
- Recruiting opportunities are collected, deduplicated, ranked, and tracked in one place.
- Canvas assignments become visible tasks and suggested study blocks.
- The chatbot can recall stored personal context and turn thoughts into tasks, plans, notes, or drafts.
- The app is installable on Mac and iPhone and can send restrained, useful notifications.
- Gamification rewards returning and recovering, not perfect streaks.

### Non-goals for the first version

- Automatically submitting job applications.
- Sending email or LinkedIn messages without review.
- Replacing Canvas, Gmail, Google Calendar, LinkedIn, Handshake, or Apple Health as systems of record.
- Medical diagnosis, fertility guidance, calorie prescriptions, or automated health interventions.
- Perfectly scraping every job board.
- A native iOS app before the web product proves useful.
- Multi-user permissions, billing, teams, or public launch infrastructure.

## 3. Core design principles

1. **Capture first, organize second.** The inbox accepts messy text in seconds.
2. **One source of truth inside GYST.** External items are normalized into common events, tasks, documents, and opportunities, with links back to their source.
3. **Suggestions, not silent actions.** The app may read, classify, rank, schedule, and draft. It must ask before changing an external calendar and must never send messages or applications.
4. **Feasibility over ambition.** Daily capacity is finite. Fixed commitments, buffers, sleep, meals, and recovery reduce available planning time.
5. **Anxiety-aware UX.** No red wall of overdue work, guilt copy, broken-streak punishment, or endless notification escalation.
6. **Local-first feeling, cloud-backed convenience.** The UI is fast and cacheable; sync and automation run securely in the cloud.
7. **Progressive automation.** Prove each workflow manually, then automate it.
8. **Every AI output is editable and attributable.** Show what data informed a recommendation and make corrections easy.

## 4. Recommended technical stack

### Primary application

| Layer | Choice | Why |
|---|---|---|
| Web framework | Next.js App Router + TypeScript | One codebase for desktop and mobile; server routes and UI together; strong AI coding support. |
| Mobile delivery | Progressive Web App (PWA) | Installable on Mac/iPhone without App Store work; supports home-screen installation and web push on modern iOS when installed. See the [official Next.js PWA guide](https://nextjs.org/docs/app/guides/progressive-web-apps). |
| Styling | Tailwind CSS + shadcn/ui primitives | Fast to build, easy to theme, accessible components without locking into a large design system. |
| Database | Supabase Postgres | Relational data fits tasks, events, applications, contacts, and integrations better than a document database. |
| Auth | Supabase Auth, restricted to one allowed email | Simple sign-in and a hard single-user boundary; use Row Level Security on every personal table. See [Supabase Auth](https://supabase.com/docs/guides/auth). |
| File storage | Supabase Storage | Resumes, syllabi, transcripts, job descriptions, notes, and exported data. |
| Semantic memory | Postgres + pgvector | Keeps structured records and searchable long-term memory in the same system. |
| Background jobs | Supabase Cron + Edge Functions initially | Scheduled syncs and reminders without a separate worker service. Supabase supports scheduled functions with Cron and Vault-managed secrets; see [official scheduling documentation](https://supabase.com/docs/guides/functions/schedule-functions). |
| Deployment | Vercel for Next.js + Supabase hosted project | Easiest first deployment; replace only if cost or privacy later demands it. |
| Validation | Zod | Validate connector data, AI structured outputs, forms, and environment variables. |
| Testing | Vitest + React Testing Library + Playwright | Unit tests for planning/ranking logic; end-to-end tests for critical flows. |
| Monitoring | Sentry free tier or structured database logs | Capture sync failures and client errors without building an admin system. |

### AI layer

- Create one provider-neutral `AIClient` interface so the model can change without rewriting product logic.
- Begin with the least expensive reliable model that supports structured output and tool calling. Keep deterministic rules outside the model.
- Use AI for extraction, classification, summarization, ranking explanations, drafting, and conversation.
- Use ordinary code for permissions, dates, scheduling constraints, scoring arithmetic, deduplication, reminders, and state transitions.
- Store prompts as versioned files under `src/ai/prompts/`, not scattered strings.
- Require Zod-validated JSON for every workflow that changes data.
- Cache results by input hash. Never re-summarize unchanged documents or job descriptions.
- Add per-feature daily token and dollar limits plus an AI usage page.
- For a nearly free local option, support an optional Ollama adapter for chat/extraction on the Mac. Cloud models remain the fallback for dependable scheduled automation because hosted jobs cannot call a sleeping laptop.

### Native iPhone companion - later, only for HealthKit

A web app cannot directly read the private HealthKit store. HealthKit access belongs in an Apple-platform application with explicit permission; Apple describes HealthKit as the iPhone/Apple Watch health repository and requires granular authorization. See [HealthKit documentation](https://developer.apple.com/documentation/healthkit) and [HealthKit access configuration](https://developer.apple.com/documentation/xcode/configuring-healthkit-access).

After the PWA is useful, add a minimal SwiftUI companion that:

- authenticates the same user;
- requests only the chosen HealthKit read permissions;
- reads approved summaries such as sleep, workouts, activity, resting heart rate, and cycle data;
- uploads daily aggregates to a protected endpoint;
- never exposes raw health data to the chatbot by default;
- opens the PWA for the full product experience.

Do not use React Native initially. A tiny native bridge plus the existing PWA is less work than rebuilding the entire interface.

**2026-07-16 update:** descoped. Ishani declined the Apple Developer Program enrollment this requires, so the native companion described above will not be built. Apple Watch/HealthKit data (steps, sleep, resting heart rate, workouts) is entered manually in the webapp instead — see Phase 9B in §15 and `docs/PHASES/phase-9.md`. The built-and-tested device-pairing/token-exchange code was removed rather than left unused.

## 5. Information architecture

### Global navigation

- **Today**
- **Inbox**
- **Recruiting**
- **School**
- **Wellness**
- **Chat**
- **Settings / Integrations**

### Universal task board

Tasks should have a Notion-style Kanban view made of compact draggable cards. The default columns are:

1. **Not Started**
2. **In Progress**
3. **Completed**

Dragging a card left or right immediately updates its status, with an undo toast. Users can also change status from the card menu for accessibility and on small phone screens. Each card shows only the essentials - title, area, due date, estimated duration, and urgency - and expands for notes, subtasks, source links, and scheduling controls. The board can be filtered by Today, This Week, Recruiting, School, Wellness, project, or goal. Completed cards collapse by default so progress feels visible without cluttering the board.

### Today screen

Above the fold:

- greeting, date, current energy/mood;
- one-line focus: "If today goes well, what is true?";
- fixed timeline from Google Calendar, classes, and fencing;
- proposed time blocks with accept/edit/dismiss controls;
- top three outcomes;
- inbox capture field always visible;
- "I'm overwhelmed" button;
- small progress/XP indicator, never a giant overdue count.

Below the fold:

- this week's deadlines and applications;
- tasks needing clarification;
- wellness check-in;
- proactive assistant cards such as schedule conflicts, closing jobs, or overloaded days.

### Brain dump flow

One text area accepts entries such as:

> email professor, apply to Adobe PM, worried about econ midterm, buy groceries, practice interview stories next weekend

Pipeline:

1. Save the raw text immediately before AI runs.
2. Extract candidate tasks, notes, worries, goals, dates, people, and projects.
3. Show a compact confirmation sheet.
4. Save accepted items; retain the original entry and extraction provenance.
5. If uncertain, keep the item in Inbox rather than inventing details.

Quick-capture entry points later: global keyboard shortcut, PWA share target, browser extension, email-forwarding address, and iOS Shortcut.

### Overwhelm mode

When activated:

1. Ask for current energy with one tap: low / medium / high.
2. Protect fixed commitments, meals, travel, and recovery.
3. Select at most one urgent task, one small life-maintenance task, and one self-care action.
4. Move everything else to a review queue - not silently to tomorrow.
5. Offer a 10-minute starter step.
6. Use neutral language: "Here is the smallest day that still counts."

## 6. Data model

Use UUID primary keys, `created_at`, `updated_at`, optional `deleted_at`, and `source`/`source_id` on synced entities. Store times in UTC and retain the source timezone.

### Identity and settings

- `profiles`: user identity, timezone, allowed email.
- `preferences`: working hours, buffer defaults, notification rules, AI limits, theme.
- `integrations`: provider, status, granted scopes, last sync, error state.
- `oauth_tokens`: encrypted server-only tokens; never readable by the browser.
- `sync_runs`: provider, cursor, start/end, counts, error, retry state.

### Organization

- `inbox_items`: raw capture, parsed status, source, original text.
- `tasks`: title, notes, area, status, priority, estimated minutes, energy, due date, earliest start, source, rollover count.
- `task_dependencies`: blocking relationships.
- `projects`: goal, area, status, target date.
- `goals`: horizon, success definition, progress type.
- `events`: fixed/flexible, start/end, location, travel buffer, external calendar ID.
- `time_block_suggestions`: task, proposed interval, score, status, explanation.
- `daily_plans`: capacity, top outcomes, mode, accepted version.
- `check_ins`: mood, energy, stress, sleep perception, optional note.

### Recruiting

- `job_sources`: source type, URL/feed config, health, last fetch.
- `companies`: name, domain, size/category when known.
- `opportunities`: normalized role, company, location, description, dates, URL, source, fingerprint, active state.
- `job_scores`: eligibility, role fit, company fit, experience fit, deadline urgency, explanation, score version.
- `applications`: stage, submitted date, deadline, resume version, notes, next action.
- `application_events`: immutable stage history.
- `contacts`: person, company, role, relationship, last/next contact.
- `interactions`: meeting/message notes and follow-up date.
- `documents`: resume, transcript, cover letter, job description, syllabus, or general reference.
- `drafts`: cover letter, recruiter message, or application response with source references and approval status.
- `recruiting_insights`: funnel metrics and rejection patterns; label AI interpretations as hypotheses.

Suggested application stages: discovered, saved, preparing, ready, applied, assessment, recruiter screen, interview, final round, offer, rejected, withdrawn, archived.

### School

- `courses`: term, title, code, Canvas ID, instructor.
- `assignments`: course, Canvas ID, due date, points, submission state, source URL.
- `assessments`: course, type (quiz/midterm/final/presentation/project/other), scheduled date, location, coverage, preparation status, source, confidence.
- `course_events`: exams, office hours, lectures, sections.
- `syllabus_items`: extracted policies, major dates, confidence, source page.
- `work_estimates`: predicted minutes, actual minutes, estimator version.

### Wellness

- `wellness_check_ins`: subjective sleep, energy, mood, stress, meals-consistency response, note.
- `health_daily_summaries`: date, approved aggregate metrics, source, sync time.
- `wellness_goals`: user-authored behavior goals without medical prescriptions.
- `cycle_observations`: only fields explicitly selected by Ishani; separate permissions and deletion controls.

### Chat and memory

- `conversations` and `messages`.
- `memory_items`: fact/preference/goal/decision, text, embedding, confidence, source message, status.
- `memory_links`: links memory to tasks, contacts, jobs, courses, or documents.
- `assistant_actions`: proposed tool/action, preview, approval state, execution log.

Permanent memory must mean durable and user-controlled, not indiscriminate storage. Provide a Memory page to view, edit, pin, archive, delete, and export everything remembered.

## 7. Scheduling engine

Build a deterministic scheduler before asking AI to plan time.

### Inputs

- fixed calendar events, class periods, fencing, travel, meals, sleep window;
- task deadline, duration estimate, priority, energy requirement, and splittability;
- user energy check-in and daily maximum planned focus time;
- buffers between commitments;
- unfinished tasks and rollover history.

### Algorithm v1

1. Build free-time intervals from the calendar.
2. Reduce available capacity by a configurable safety factor, initially 25%.
3. Score candidate tasks:

   `score = deadline urgency + explicit priority + goal importance + short-task bonus + rollover pressure - energy mismatch - context switching - overload penalty`

4. Place high-energy tasks in preferred focus windows.
5. Split only tasks marked splittable, with a minimum block length.
6. Leave at least one unscheduled buffer block per day.
7. Return suggestions; do not write them to Google Calendar until approved.

### Rollover rules

- A missed task returns to a review queue.
- First miss: suggest the next feasible slot.
- Repeated misses: ask whether to reduce, break down, reschedule, delegate, or delete it.
- Never keep increasing priority just because something is old.
- Track estimate accuracy and update future duration predictions with a simple weighted average.

## 8. Integrations and feasibility

### Google Calendar - high confidence

- OAuth with the narrowest scopes possible.
- Phase 1: read calendars/events and calculate availability.
- Phase 2: create suggested blocks on a dedicated GYST calendar only after approval.
- Use incremental sync tokens, provider IDs, and webhooks later.
- Google documents granular read/write scopes in its [Calendar authorization guide](https://developers.google.com/workspace/calendar/api/auth).

### Gmail - high confidence, privacy-sensitive

- Use server-side OAuth because scheduled sync requires offline access; Google documents this flow in the [Gmail authorization guide](https://developers.google.com/workspace/gmail/api/auth/web-server).
- Start with a narrow query/label strategy: recruiting senders, interview scheduling, application confirmations, and user-forwarded messages.
- Store message metadata and extracted action items by default, not entire mailboxes.
- Keep links back to Gmail.
- Draft replies only; do not request send permission.
- Later use Gmail push notifications if polling becomes wasteful.

### Canvas - medium/high confidence, Stanford permission dependent

- Canvas provides a REST API authenticated with OAuth2; see [Canvas API documentation](https://developerdocs.instructure.com/services/canvas) and [OAuth overview](https://developerdocs.instructure.com/services/canvas/oauth2/file.oauth).
- First test whether Stanford permits a personal access token. If yes, use it locally/server-side for this single-user app.
- Production OAuth needs a Canvas developer key, generally controlled by the institution. Do not make that approval a prerequisite for the MVP.
- Sync active courses, assignments, due dates, submission state, announcements, and calendar events.
- Fallbacks: `.ics` calendar feed, manual syllabus upload, or email ingestion.

### Notion - optional

- Do not attempt two-way sync initially; it recreates the fragmentation problem.
- Provide a one-time import or explicit "send to GYST" database connection later.
- Keep GYST as the source of truth after import.

### Recruiting sources - adapter strategy

Do not base the product on unrestricted LinkedIn or Handshake scraping. LinkedIn notes that most API permissions require approval, and job-posting APIs target approved partners rather than personal job discovery; see [LinkedIn API access](https://learn.microsoft.com/en-us/linkedin/shared/authentication/getting-access) and [Apply Connect requirements](https://learn.microsoft.com/en-us/linkedin/talent/apply-connect/create-apply-connect-jobs).

Use a legal, replaceable `JobSourceAdapter` interface:

```ts
interface JobSourceAdapter {
  id: string
  discover(input: SearchProfile): Promise<RawJob[]>
  normalize(raw: RawJob): Promise<NormalizedJob>
  healthCheck(): Promise<SourceHealth>
}
```

Source order:

1. Public employer ATS endpoints/pages such as Greenhouse and Lever.
2. Public, permitted feeds and curated internship lists.
3. User-provided URLs via paste, browser extension, or share sheet.
4. Gmail alerts and confirmations.
5. Handshake/LinkedIn links saved manually into the unified tracker.
6. A search API only if coverage justifies the small monthly cost.

Every source needs rate limits, caching, provenance, robots/terms review, parser fixtures, failure alerts, and a kill switch. Never bypass login walls, CAPTCHAs, or anti-bot controls.

### Apple Health / Apple Watch - manual entry (native companion declined)

- Phase 0-5: subjective daily check-ins and optional manual aggregate entry.
- ~~Later: SwiftUI HealthKit reader with explicit per-data-type permissions.~~ Declined 2026-07-16 (no Apple Developer Program enrollment) — manual entry is the permanent approach, not an interim one.
- Sync (now: log) only daily summaries needed for the selected UI.
- Treat Mira as manual/CSV input unless Mira provides Ishani with an authorized export or supported personal API. Do not scrape a health account.

### Phone reminders

- First use PWA web push. The official Next.js guide notes iOS web push support for home-screen-installed apps.
- Add an in-app notification center and quiet hours.
- Send deadline reminders only when actionable.
- Native notifications can come with the later iPhone companion.

## 9. Recruiting ranking and workflow

### Search profile

Initial target families:

- product management;
- product operations / business operations;
- strategy and consulting;
- growth / business development;
- data analytics and insights;
- AI-adjacent non-SWE roles;
- venture/startup ecosystem roles that are not finance-focused.

Preferences:

- summer 2027 internships;
- established companies receive a modest return-offer bonus;
- exclude pure software engineering and finance roles;
- no hard location or company-size restriction;
- GPA is not used as a ranking signal, but explicit eligibility requirements must still be shown.

### Transparent scoring v1 (100 points)

- Role-family match: 25
- Skills/experience match: 20
- Eligibility and graduation-year fit: 20
- Interest/industry fit: 10
- Established-company/return-offer potential: 10
- Deadline urgency: 10
- User feedback/history: 5

Hard exclusions: wrong internship year, explicitly ineligible graduation date, closed role, pure SWE, or pure finance. Never infer protected characteristics. Show the score breakdown and let Ishani correct it.

### Tailoring flow

1. Select opportunity and resume version.
2. Extract job requirements.
3. Match only truthful resume evidence.
4. Draft a short cover letter or recruiter message.
5. Highlight unsupported claims and missing evidence.
6. Require review and copy/export; never send.
7. Save the final edited version so future drafting learns stylistic preferences without inventing experience.

### Analytics

- applications per week;
- stage conversion rates;
- response time;
- source effectiveness;
- role-family conversion;
- follow-ups due;
- rejection themes marked as uncertain unless confirmed.

## 10. School workflow

### Academic page layout

The academic page should begin with an **Upcoming Assessments** section rather than making assessments disappear inside the general task list. It includes:

- assessment cards ordered by date, with course, type, countdown, location, and preparation status;
- a compact 7-day view plus an expandable term timeline;
- preparation progress such as not planned, plan created, preparing, and ready;
- a one-click action to create a backward study plan around class, fencing, and existing commitments;
- warnings for assessment clusters, such as two exams within 48 hours;
- source links back to Canvas or the uploaded syllabus and a confirmation marker for AI-extracted dates.

Below Upcoming Assessments, show this week's assignments and the School-filtered Kanban board. Assessments remain distinct from ordinary assignments even when both generate preparation tasks.

### Automated intake

- Sync Canvas assignments and events.
- Detect quizzes, midterms, finals, presentations, and major project deadlines as assessment candidates.
- Parse uploaded syllabi into candidate dates and policies with page citations/confidence.
- Require confirmation before creating important deadlines from AI extraction.
- Merge duplicates by Canvas ID or course/date/title fingerprint.

### Planning behavior

- Convert large assignments into suggested milestones.
- Estimate duration from assignment type and later from actual completion history.
- Place work around classes, fencing, travel, and recruiting deadlines.
- Display school work in the universal Today and Week views; no separate dashboard per course.
- Keep the chatbot universal. Course documents are contextual sources, not separate bots.

## 11. Wellness scope and safeguards

The goal is supportive awareness and consistency, especially around eating sufficiently, recovery, stress, sleep, and menstrual-cycle return. Loss of a period can warrant professional medical evaluation; the app must not diagnose causes or prescribe food/exercise changes.

Product boundaries:

- Track only metrics Ishani chooses.
- Prefer gentle daily check-ins over calorie counting or punitive targets.
- Show observations such as "sleep was shorter on three nights" rather than causal medical claims.
- Never use wellness data to score productivity or recruiting performance.
- Never let streak loss trigger negative language.
- Keep raw health data out of general AI context unless explicitly attached to a question.
- Offer clear export/delete controls and an emergency stop for health syncing.
- Include static copy that the feature is not medical advice and encourage working with a qualified clinician for absent periods or concerning symptoms.

Suggested check-in: energy, mood, stress, perceived sleep, ate consistently today (yes/somewhat/no/prefer not to say), recovery, and optional note. All fields are skippable.

## 12. Chatbot and permanent memory

### Chat capabilities

- brain dump and organize;
- query tasks, schedule, applications, contacts, courses, and stored documents;
- explain why a job was ranked;
- propose a daily/weekly plan;
- break an avoided task into a starter step;
- draft cover letters, recruiter messages, and email replies;
- save explicit facts, preferences, goals, and decisions;
- propose actions with a preview.

### Retrieval pipeline

1. Classify intent.
2. Load current date/time and relevant structured records.
3. Retrieve a small number of memory/document chunks with source metadata.
4. Generate a response or typed action proposal.
5. Validate action arguments.
6. Ask for confirmation for external writes or high-impact bulk edits.
7. Log execution and show undo where possible.

### Memory policy

- Explicit "remember this" always creates a proposed memory.
- Automatically extracted memories appear in a reviewable queue.
- Distinguish facts, preferences, goals, and temporary context.
- Store source, date learned, confidence, and last-used date.
- Let the user correct or delete a memory from the chat itself.
- Health, academic records, email bodies, and credentials are excluded from automatic memory.
- Deleting a source should optionally cascade to derived memory and embeddings.

## 13. Gamification

Use "cozy progress," not addictive mechanics.

- XP for capturing thoughts, planning realistically, finishing a focus block, reviewing an overdue item, and returning after time away.
- Bonus for recovery: reopening the app after a missed week is celebrated.
- Optional levels unlock themes, dashboard decorations, or tiny plant/room growth.
- Weekly quests are user-controlled and limited to three.
- No leaderboards, loss aversion, paid rewards, or unbreakable streaks.
- A consistency metric can count "days engaged this week" without resetting a lifetime identity.
- **Planned (Phase 9D, not yet built):** replace the numeric XP/"days engaged" display with an ambient visual (a room element that grows/brightens) as the default view of the same underlying `xp_events` ledger — the ledger and its insertion logic stay exactly as described above; only the display changes. See `docs/PHASES/phase-9d.md`.

## 14. Privacy and security

This app combines email, education, recruiting, and health information, so security is a core feature.

- Allow only the configured Stanford/personal email to authenticate.
- Enable RLS on every user-owned table and test policies.
- Keep provider refresh tokens encrypted and server-only; use a secrets vault.
- Request the narrowest OAuth scopes and introduce scopes feature by feature.
- Never place service-role keys or AI keys in browser code.
- Encrypt especially sensitive wellness fields at the application layer if stored in cloud Postgres.
- Separate health summaries from ordinary assistant retrieval.
- Sanitize uploaded files and restrict type/size.
- Treat job descriptions, emails, and documents as untrusted content; they cannot override system/tool rules.
- Add rate limits, CSRF protection, secure cookies, Content Security Policy, and audit logs.
- Provide one-click export and account/data deletion.
- Back up the database and test restore before trusting it with irreplaceable notes.
- Keep development and production data separate; use fake fixtures in tests.
- Add a settings matrix showing exactly what each integration can read and write.

## 15. Build phases

Each phase ends with a usable vertical slice. Do not start the next phase until the exit criteria pass.

### Phase 0 - Decisions and foundation (1-2 sessions)

**Goal:** establish constraints without building features.

- [ ] Choose app name and create a private repository.
- [ ] Write a one-page product brief from sections 1-3.
- [ ] Create a data classification table: ordinary, private, highly sensitive.
- [ ] Create free Supabase and Vercel projects.
- [ ] Confirm Google account(s), Calendar account, Stanford Canvas domain, and whether Canvas personal tokens are allowed.
- [ ] Decide initial AI provider and set a $5/month hard budget alert.
- [ ] Create `.env.example`; ensure real secrets are ignored.
- [ ] Save this plan under version control.

**Exit:** local skeleton boots, cloud projects exist, and no secrets are committed.

### Phase 1 - Cozy shell and universal capture (3-5 sessions)

**Goal:** replace scattered mental notes with one trusted inbox.

- [ ] Scaffold Next.js, TypeScript, Tailwind, component library, linting, formatting, and tests.
- [ ] Implement single-user authentication and RLS.
- [ ] Build responsive navigation and cozy design tokens.
- [ ] Create Inbox, tasks, projects, goals, and settings schema.
- [ ] Build instant raw brain-dump capture.
- [ ] Add deterministic manual conversion from inbox item to task/note/goal.
- [ ] Add AI extraction behind a feature flag with confirmation UI.
- [ ] Build task list, quick edit, due date, duration, status, and area.
- [ ] Build the draggable Kanban board with Not Started, In Progress, and Completed columns, plus keyboard/mobile status controls.
- [ ] Add PWA manifest, icons, install instructions, and offline shell.

**Exit:** from Mac and iPhone, a thought can be captured in under five seconds and safely converted into tasks.

### Phase 2 - Today, week, and realistic planning (4-7 sessions)

**Goal:** turn commitments into a manageable day.

- [ ] Build Today and Week views.
- [ ] Add manual recurring class and fencing schedules first.
- [ ] Add daily check-in and capacity setting.
- [ ] Implement deterministic free-time and task-scoring engine.
- [ ] Display editable time-block suggestions.
- [ ] Implement rollover review instead of silent backlog growth.
- [ ] Build Overwhelm Mode.
- [ ] Add top-three outcomes and weekly goals.
- [ ] Add calm gamification and return-after-absence rewards.
- [ ] Unit-test daylight-saving changes, overlapping events, zero-capacity days, and overdue tasks.

**Exit:** the app produces a feasible day and handles missed tasks without creating shame or schedule collisions.

### Phase 3 - Google Calendar and notifications (3-6 sessions)

**Goal:** stop duplicating schedule information.

- [ ] Configure Google OAuth with read-only Calendar scopes.
- [ ] Sync events incrementally; normalize timezone and recurrence.
- [ ] Map class and fencing calendars as fixed commitments.
- [ ] Add sync status, manual refresh, reconnect, and error logs.
- [ ] Request write scope only when enabling approved time blocks.
- [ ] Write only to a dedicated GYST calendar.
- [ ] Add undo for created blocks.
- [ ] Add notification center, quiet hours, and PWA web push.

**Exit:** Calendar imports reliably for one week, no duplicates appear, and approved blocks round-trip correctly.

### Phase 4 - Recruiting MVP (5-9 sessions)

**Goal:** create a trustworthy opportunity and application command center before automating discovery.

- [ ] Build opportunities, companies, applications, stages, contacts, interactions, and documents.
- [ ] Add paste-a-job-URL/manual job entry.
- [ ] Upload resume versions, transcript, and writing samples.
- [ ] Implement transparent job scoring with editable preferences.
- [ ] Build Kanban and table application views.
- [ ] Add next-action and follow-up reminders.
- [ ] Add contact CRM and networking timeline.
- [ ] Generate truthful cover-letter and recruiter-message drafts with evidence links.
- [ ] Add role/company-specific preparation notes without a separate interview-prep product.
- [ ] Build funnel analytics and source tracking.

**Exit:** one real application can go from saved job through submission tracking and follow-up without another spreadsheet.

### Phase 5 - Recruiting discovery automation (ongoing adapters)

**Goal:** collect high-quality summer 2027 roles without fragile dependence on one board.

- [ ] Implement source-adapter contract, fixtures, health checks, and provenance.
- [ ] Start with a small list of target-company ATS sources.
- [ ] Add public/curated internship feeds with terms review.
- [ ] Schedule daily discovery, normalization, deduplication, and expiry checks.
- [ ] Add hard exclusion filters and personalized ranking.
- [ ] Add thumbs up/down/not relevant feedback.
- [ ] Create a browser extension or share-to-GYST bookmarklet for LinkedIn/Handshake.
- [ ] Add weekly digest and applications-closing-soon view.
- [ ] Evaluate a paid search API only after measuring coverage gaps.

**Exit:** at least 80% of surfaced roles are plausibly relevant, duplicates stay below 5%, and broken sources fail visibly rather than silently.

### Phase 6 - Canvas and school planning (4-7 sessions)

**Goal:** pull school obligations into the same planning loop.

- [ ] Test Canvas personal-token/API access.
- [ ] Implement courses, assignments, events, and submission sync.
- [ ] Build the Upcoming Assessments section with countdowns, preparation status, and term timeline.
- [ ] Extract assessment candidates from Canvas and syllabi and require confirmation for uncertain dates.
- [ ] If blocked, implement `.ics` import plus syllabus upload first.
- [ ] Add syllabus PDF extraction with source page/confidence review.
- [ ] Suggest milestones for major assignments.
- [ ] Add duration estimates and actual-time feedback.
- [ ] Resolve duplicates between Canvas, syllabus, Gmail, and Calendar.
- [ ] Feed school tasks into the universal scheduler.

**Exit:** current courses and deadlines remain accurate for two weeks with a clear fallback when sync fails.


### Phase 7 - Gmail-assisted automation (4-7 sessions)

**Goal:** detect actionable recruiting and school messages without copying an entire inbox.

- [ ] Confirm whether Gmail and Google Calendar live on the same Google account. If not, this is a second, separate OAuth connection — one token is tied to exactly one Google account, so Calendar (Phase 3) and Gmail can't share a token if they're different accounts. The `integrations`/`oauth_tokens` schema built in Phase 3 only supports one Google connection per user (`unique (user_id, provider)` with `provider = 'google'`); extend it (e.g. distinguish connections by account or by purpose) before or as part of wiring up Gmail OAuth here.
- [ ] Configure Gmail OAuth and narrow read scopes.
- [ ] Begin with user-created Gmail labels or strict searches.
- [ ] Extract interview dates, application confirmations, deadlines, and requested actions.
- [ ] Show every extracted item in a review queue.
- [ ] Link back to the original Gmail message.
- [ ] Add draft-only replies and follow-ups.
- [ ] Add retention controls for message excerpts.

**Exit:** tested messages produce correct suggestions, no email is sent, and irrelevant personal mail is not stored.

### Phase 8 - Universal chatbot and durable memory (5-8 sessions)

**Goal:** make all stored information conversational without giving AI uncontrolled access.

- [ ] Build chat UI with streaming and conversation history.
- [ ] Implement typed read tools for tasks, schedule, school, recruiting, and documents.
- [ ] Add memory extraction/review and Memory management page.
- [ ] Add semantic retrieval with citations to stored records.
- [ ] Add proposed actions and approval previews.
- [ ] Add prompt-injection defenses and tool authorization tests.
- [ ] Add token tracking, caching, conversation compaction, and context limits.
- [ ] Test that health data is excluded unless explicitly requested.

**Exit:** the assistant answers cross-area questions accurately, cites its internal sources, remembers corrected preferences, and cannot perform unapproved writes.

### Phase 9 - Wellness and HealthKit (two steps)

**Goal:** add supportive health context after the core app is trustworthy.

**9A - PWA check-ins**

- [ ] Add optional lightweight wellness check-in.
- [ ] Build private weekly trends with neutral language.
- [ ] Add granular data visibility, export, and deletion.
- [ ] Add health disclaimer and safe-response policy.

**9B - native companion, descoped 2026-07-16 to manual entry** (no Apple Developer Program enrollment — see `docs/PHASES/phase-9.md`)

- [ ] ~~Create minimal SwiftUI iPhone app.~~ Not pursued.
- [ ] ~~Add Sign in and secure device-to-server token exchange.~~ Built, tested, then removed — no consumer without a native client.
- [ ] ~~Request chosen HealthKit permissions contextually.~~ Not applicable.
- [x] Sync only approved daily summaries → resolved as logging only approved daily summaries via a webapp form.
- [x] Handle permission revocation and deleted Health data → resolved as delete-all-logged-entries.
- [x] Evaluate Mira export/import without assuming an API → resolved via manual/CSV cycle-data import.
- [x] Complete security/privacy review before real data sync → done, scoped to the manual-entry surface.

**Exit:** deleting logged/synced summaries works, and the main chatbot does not see them by default. ("Revoking Health permissions" no longer applies — there's no OS permission without a native client.)

### Phase 9C - Cozy visual identity, motion, and companion character (4-8 sessions)

**Goal:** give the app its own emotional identity — satisfying interactions and a companion that reflects what you're actually doing — now that Calendar (Phase 3), Recruiting (Phase 4-5), School (Phase 6), and Wellness (Phase 9) provide real activity signal for it to reflect. Bundled as one phase rather than a motion pass now and a character pass later, so shared UI (hover states, transitions) isn't touched twice.

- [x] Build a shared motion/animation utility layer (easing curves, spring configs, durations) reused across the app.
- [x] Add satisfying hover/press micro-interactions to core primitives (buttons, task cards, capture field) - expand/scale/spring on hover.
- [x] Smooth page and loading transitions (route changes, skeleton states) instead of abrupt swaps.
- [x] Finalize/refine the color palette and cozy design tokens established in Phase 1.
- [x] Reframe the Today dashboard with a "living room" spatial metaphor (zones for capture, tasks, and the companion).
- [x] Design and build the companion blob: base shape and face, idle animation, and a small set of expressive states.
- [x] Wire the companion's state to real activity signals already available by this point (calendar events, task area, application stage) - fencing/studying/recruiting/resting - no manual status-setting required.
- [x] Keep gamification "cozy progress" per PLAN.md §13: cosmetic-only companion reactions, no streaks, no loss aversion.

**Exit:** hovering or interacting with core UI feels satisfying and intentional, and the Today screen's companion visibly reflects your actual current context without manual input.

### Phase 9D - Spatial living-room redesign (planned, not started)

**Goal:** replace the dashboard-with-sidebar shell from Phase 1/9C with a literal spatial "room" you click into, per Ishani's 2026-07-17 direction: no fixed sidebar, no numeric XP, a warmer/gamier Animal-Crossing-style palette that shifts with time of day, and the companion blob repurposed as the persistent chat launcher. Full design detail (including the room map) lives in `docs/PHASES/phase-9d.md`; this entry tracks it at the roadmap level.

**Recommended order (Ishani, 2026-07-21):** ship Phase 11 (automations reliability, below) before the remaining room visuals — three of five cron jobs are likely silently not firing under the Vercel Hobby cap, and that's worth fixing before adding more surface area. Then 9D-2/9D-4/9D-5 (room visuals for Wellness/Recruiting/School). Companion redesign (9D-6) goes last.

Room map (confirmed 2026-07-17): four full rooms with zoom transitions - Wellness (garden), Gmail (mailbox), Recruiting (office/desk), School (study nook, absorbs the fuller task board/detail view). Inbox and Settings drop their standalone pages and become ambient objects in the Living Room hub itself - Inbox as a bedside journal, Settings as a wall thermostat/control panel - rather than doorways. General/urgent tasks keep a small ambient list on the Today hub; the universal task board stays cross-area (not folded entirely into School), since `tasks.area` spans recruiting/school/wellness/general (§5/§6).

Split into sub-phases (2026-07-17) so each session ships one coherent slice - the shared foundation first, then one sub-phase per room:

- [x] **9D-1 - Foundation:** day-period palette tokens, the reusable room engine (`RoomDoorway`/`RoomHeader` with a Framer Motion shared-element zoom), shared hover/glow/expand mechanics for room objects, the rebuilt Today page as the Living Room hub (four placeholder doorways, the journal and thermostat ambient objects, the ambient task list), sidebar retirement, the ambient XP/growth visual, and the companion blob as global chat launcher. No room gets final theming yet. Built 2026-07-17; not yet visually verified in-browser (auth-gated — Ishani checking herself).
- [x] **9D-2** - Wellness room: garden theming. Done 2026-07-21 - split into two panels so the greenhouse's bench/rug stays visible, check-in + weekly trends always shown, everything else collapsed behind `<details>`, plus a new ambient `GrowthPlant` fed by check-in consistency (`docs/PHASES/phase-9d.md` for the full account, including two rendering bugs caught via real screenshots). Established as the default template for 9D-4/9D-5.
- [ ] **9D-3** - Gmail room: mailbox theming.
- [x] **9D-4** - Recruiting room: office/desk theming. Done 2026-07-21, bundled with real functional additions Ishani asked for in the same pass: a `DeadlineTimeline` replacing the old ClosingSoon/FollowUpsDue text lists, ghosted-application detection (60+ days with no reply), a weekly application-goal meter, and upgraded dashboard charts (ran the dataviz skill for real, which surfaced a genuine pre-existing gap - this app's `--chart-1..5` tokens fail the six-checks palette validator in both light and dark mode; worked around it for this feature, flagged the fix as a separate follow-up). Same-day follow-up: the static "More" panel became `RoomSideTabs`, a desktop-only right-docked tab rail that expands leftward on click and closes on click-away; Pipeline's tab is now a big searchable table with stat tiles up top (`min(820px, 80vw)`, not a full-screen takeover). Full account in `docs/PHASES/phase-9d.md`.
- [ ] **9D-5** - School room: study-nook theming, including how the fuller task board/detail view is presented there.
- [ ] **9D-6** - Companion character redesign and per-room presence: replace the hand-coded SVG blob with art that matches the illustrated room style, and give it a real position/behavior in Wellness/Recruiting/School (not just a fixed bottom-right button outside the hub). State-derivation logic (Phase 9C) is unchanged - display layer only.

**Exit:** the sidebar and numeric XP are gone; navigating between sections feels like moving through a spatial room rather than switching dashboard tabs; the companion blob is reachable as the chat entry point from anywhere in the app and visually belongs in every room, not just the hub; all four rooms have their own themed dressing, not a shared generic skin.

### Phase 10 - Polish and reliability (ongoing)

- [ ] Run accessibility audit and keyboard-navigation pass.
- [ ] Add loading, empty, offline, stale-data, and connector-failure states.
- [ ] Add backups, restore drill, export, and full deletion.
- [ ] Add integration health dashboard.
- [ ] Measure capture speed, planning acceptance, notification usefulness, and job relevance.
- [ ] Remove features that create upkeep without repeated value.
- [ ] Conduct monthly dependency/security updates.

### Phase 11 - Automations reliability: migrate scheduling to Supabase pg_cron

**Goal:** fix a real gap surfaced 2026-07-20 (see `docs/PHASES/phase-10.md`): `vercel.json` schedules five cron jobs (`discover-jobs`, `weekly-digest`, `sync-canvas`, `sync-gmail`, `purge-gmail-items`), but the Vercel Hobby plan caps cron at 2 jobs/day - so at most two of the five are actually firing. Decided 2026-07-21: move scheduling to Supabase `pg_cron`/`pg_net` rather than upgrading to Vercel Pro, since it removes the cap without an ongoing cost and every route already authenticates via a `CRON_SECRET` bearer header (`getCronEnv()`), which `net.http_post` can send identically - no route code changes needed.

- [x] Write a decision doc (`docs/DECISIONS/0005-pg-cron-scheduling.md`) covering the approach and secret storage (Supabase Vault).
- [x] Migration: enable `pg_cron` and `pg_net` extensions.
- [x] Migration: `cron.schedule()` one job per route, each calling `net.http_get` against the existing `/api/cron/*` routes with the `Authorization: Bearer` header. Also added two new jobs beyond the original five: `sync-calendar` (Google Calendar had no automation at all before this) and `deadline-reminders` (fills the `notifications.kind = 'deadline'` type that existed since Phase 3 but nothing ever fired).
- [x] Remove the five entries from `vercel.json` - done once pg_net was confirmed reaching production with correct auth, to avoid double-firing overlap with pg_cron (e.g. a duplicate weekly digest).
- [x] Verify each job fires and its target data actually updates - not just HTTP 200. `sync-calendar` synced 6 calendars/153 events on its first-ever run; confirmed via a manual `net.http_get` through Postgres itself (not curl) that Supabase can reach production and get a real response back. One unrelated finding: `sync-canvas`'s cron plumbing works, but production's `CANVAS_PERSONAL_ACCESS_TOKEN` is being rejected by Canvas's own API (401) - separate follow-up, not a pg_cron issue.
- [x] Last-run visibility: no new table needed - pg_cron's built-in `cron.job_run_details` covers this once the extension is enabled.

**Exit:** all five automations run on their intended schedule, verified against actual data changes, not just HTTP 200s; a broken job is visible without checking logs by hand. **Met 2026-07-21** (`docs/PHASES/phase-11.md`), with the Canvas-token caveat above carried forward as a separate item.

## 16. Claude Code execution protocol

This protocol minimizes tokens and prevents an AI coding agent from attempting the entire roadmap at once.

### Repository documents

Create these small files before feature work:

- `PLAN.md` - this roadmap; stable product direction.
- `CLAUDE.md` - commands, architecture rules, security boundaries, and definition of done.
- `docs/ARCHITECTURE.md` - current architecture only, not future speculation.
- `docs/DATA_MODEL.md` - schema and migrations.
- `docs/DECISIONS/` - short architecture decision records.
- `docs/PHASES/phase-N.md` - only the active phase's tasks and acceptance tests.

### One-session prompt pattern

```text
Read CLAUDE.md, PLAN.md section [X], and docs/PHASES/phase-[N].md.
Implement only task [ID]. Do not begin later tasks.
First inspect relevant files and state a short plan.
Preserve existing behavior and migrations.
Run the listed focused tests, then lint/typecheck if relevant.
Update the phase checklist and architecture docs only if behavior changed.
Stop with a concise summary, files changed, tests run, and blockers.
```

### Token-saving rules

- Work one vertical slice at a time, usually one database change + one API path + one UI path.
- Give Claude exact file paths and acceptance criteria.
- Start new conversations at phase/task boundaries.
- Ask it to read only relevant docs and files, not the whole repository.
- Keep active-phase files under roughly 150 lines; archive completed detail.
- Use database migrations and generated types instead of repeatedly describing schema.
- Store reusable test fixtures for connector payloads.
- Request focused tests first; run the full suite at phase exits.
- Do not ask for broad refactors during feature work.
- Commit after each passing vertical slice so rollback is cheap.
- When stuck, ask for diagnosis separately before authorizing a fix.

### Definition of done for every task

- Acceptance criteria pass.
- TypeScript has no new errors.
- Relevant automated tests exist and pass.
- Loading, empty, error, and permission-denied states are handled.
- No secrets or sensitive fixture data are committed.
- External actions require the intended approval.
- Migrations are reversible or have a documented recovery path.
- Documentation reflects the implemented behavior.

## 17. Testing strategy

### Unit tests

- scheduling scores and free-time calculation;
- rollover and Overwhelm Mode rules;
- job filtering, ranking, and deduplication;
- connector normalization;
- permission and memory policies;
- date/timezone/recurrence utilities.

### Integration tests

- OAuth callback and token refresh with mocks;
- database RLS from authenticated and anonymous clients;
- sync idempotency and retry behavior;
- AI output validation and safe rejection;
- file upload/extraction pipeline.

### End-to-end tests

1. Capture brain dump -> confirm extraction -> appears in Today.
2. Import calendar -> generate plan -> approve block -> undo block.
3. Save job -> score -> draft message -> move application stage.
4. Sync Canvas fixture -> confirm assignment -> schedule study block.
5. Ask chat -> retrieve cited record -> propose task -> approve.
6. Activate Overwhelm Mode -> preserve commitments -> reduce plan.
7. Revoke connector -> sync stops -> UI explains recovery.

### Manual phase-exit checks

- Test on iPhone Safari home-screen mode and desktop Chrome/Safari.
- Test slow/offline connection.
- Test a full day with real but non-sensitive sample data before importing history.
- Verify notification quiet hours.
- Review every new OAuth scope and data-retention change.

## 18. Cost plan

Target during development: **$0-5/month**. (The native companion's Apple Developer membership line item no longer applies — declined 2026-07-16, see §8/§15.)

- Next.js/Vercel: free tier initially.
- Supabase: free tier initially; monitor database/storage and paused-project policies.
- AI: local Ollama for experimentation; metered cloud API capped near $5/month for reliable structured tasks.
- Search/jobs: free public sources first; do not pay until source-quality metrics show a clear gap.
- Monitoring: free tier or database logs.
- Native iOS: postpone paid distribution; local device development can precede App Store/TestFlight decisions.

Add usage counters before adding scheduled AI jobs. A cheap model invoked on an entire inbox every hour can cost more than a stronger model invoked only on changed records.

## 19. Main risks and mitigations

| Risk | Mitigation |
|---|---|
| Scope becomes overwhelming | Enforce phase exits; build capture and planning before integrations. |
| The planner creates unrealistic days | Capacity cap, buffers, energy input, acceptance metrics, deterministic tests. |
| Job scraping breaks or violates terms | Adapter architecture, public sources, manual/share fallback, no login/CAPTCHA bypass. |
| Stanford Canvas access is restricted | Test immediately; retain `.ics`, syllabus, and Gmail fallbacks. |
| HealthKit is unavailable to the web app | Declined the native companion (no Apple Developer Program enrollment); use check-ins plus manual entry instead — see §8/§15. |
| Permanent memory becomes creepy or wrong | Review queue, source/confidence, correction, deletion, excluded sensitive categories. |
| Sensitive data leaks into AI prompts | Feature-specific context builders, redaction, logging controls, no credentials/raw HealthKit. |
| Notifications increase anxiety | Quiet hours, digest-first design, actionability rules, easy global pause. |
| AI invents resume evidence | Evidence-linked drafting and explicit unsupported-claim checks. |
| Third-party APIs or free tiers change | Connector isolation, health monitoring, exportable data, provider-neutral AI interface. |
| Project maintenance becomes a second job | Prefer boring stack choices, one database, one web app, few scheduled jobs, monthly maintenance window. |

## 20. Success metrics

Track these privately and use them to simplify the app, not to judge Ishani.

### First 30 days

- Median brain-dump capture time under 10 seconds.
- App opened on at least 4 days in a typical week.
- At least 60% of proposed time blocks accepted or lightly edited.
- Fewer than 10% duplicate synced items.
- Overwhelm Mode leaves no more than three discretionary commitments.

### Recruiting

- At least 80% of surfaced roles are not immediately dismissed as irrelevant.
- Every active application has a next action or explicit waiting state.
- Follow-ups are surfaced before their intended date.
- Drafts contain no unsupported resume claims.

### Reliability

- Connector failures are visible within one sync cycle.
- Re-running a sync creates no duplicates.
- Account export is readable and deletion is verifiable.
- Restore procedure has been tested once before importing highly sensitive data.

## 21. Recommended first build slice

Do not begin with scraping, the chatbot, Canvas, or Apple Health.

Build this exact loop first:

1. Installable responsive PWA.
2. One-user sign-in.
3. Brain-dump capture that saves instantly.
4. Review AI-extracted tasks.
5. Manual class/fencing schedule.
6. Today view with a capacity-aware proposed plan.
7. Overwhelm Mode.
8. End-of-day rollover review.

If this loop is pleasant enough to use for two weeks, proceed to Google Calendar and then Recruiting. If it is not, improve the loop before adding more data sources. The value of GYST is not the number of integrations; it is whether opening it makes the day feel smaller, clearer, and possible.
