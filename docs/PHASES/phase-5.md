# Phase 5 — Recruiting discovery automation

Goal: collect high-quality summer 2027 roles without fragile dependence on
one board. Source: `PLAN.md` §15, §8, §9.

## Checklist (task IDs map 1:1 to PLAN.md §15 Phase 5 bullets)

- [x] 5.1 Source-adapter contract, fixtures, health checks, and provenance.
- [x] 5.2 Small list of target-company ATS sources (Greenhouse, Lever).
- [x] 5.3 Public/curated internship feed with terms review.
- [x] 5.4 Schedule daily discovery, normalization, deduplication, and expiry checks.
- [ ] 5.5 Hard exclusion filters and personalized ranking (discovery queue).
- [ ] 5.6 Thumbs up/down/not relevant feedback.
- [ ] 5.7 Browser extension or share-to-GYST bookmarklet for LinkedIn/Handshake.
- [ ] 5.8 Weekly digest and applications-closing-soon view.
- [ ] 5.9 Evaluate a paid search API only after measuring coverage gaps.

## Exit criteria

> At least 80% of surfaced roles are plausibly relevant, duplicates stay
> below 5%, and broken sources fail visibly rather than silently.

## Notes

- **`JobSourceAdapter` (`src/lib/job-sources/types.ts`) has three methods**: `discover(config)` hits the source and returns raw postings with a stable `externalId`; `normalize(raw, config)` reshapes one raw posting into GYST's `NormalizedJob`; `healthCheck(config)` does a cheap reachability check independent of a full discovery run, so a broken source can be flagged without pulling all its postings. `config` is the `source_configs.config` jsonb — adapter-specific, so adding an adapter never needs a schema migration.
- **Role-family/SWE/finance classification is keyword-based, in `src/lib/job-sources/classify.ts`, not AI** — CLAUDE.md keeps deterministic logic out of prompts, and there's no AI provider wired up yet anyway (`src/ai/index.ts` still returns `null`). It's a first triage pass only; once an opportunity is saved, the existing Phase 4 score-edit UI still lets the user correct it.
- **Two real, unauthenticated ATS adapters**: Greenhouse (`boards-api.greenhouse.io`) and Lever (`api.lever.co`) — both public read APIs with no ToS restriction on this kind of access, matching PLAN.md §8 source order #1. `discover()` filters to internship titles before normalizing (`isInternshipTitle` in `classify.ts`, word-boundary-aware — a naive `/intern/i` also matches "International"/"Internal", caught during live verification against Airbnb's real board and locked in with a fixture case), since an unfiltered company board is mostly full-time roles irrelevant to a Summer 2027 internship search.
- **Curated feed adapter (task 5.3) reads Pitt CSC/Simplify's `Summer2026-Internships` `listings.json`** — a public, unauthenticated file the repo generates specifically for programmatic consumption (other tools like swelist.com already consume it the same way). Terms review: no auth wall, no robots restriction on raw.githubusercontent.com, and the repo's own README advertises third-party tools built on this feed. The repo gets renamed each cycle (there's no `Summer2027-Internships` repo yet as of 2026-07-12, though the current repo already carries some `"Summer 2027"`-tagged listings) — `feedUrl` lives in `source_configs.config` so switching repos next cycle is a config edit, not a code change. Default filters: category `"Product"`, term `"Summer 2027"`.
- **Discovery orchestration lives in `src/lib/job-sources/{ingest,run-discovery}.ts`.** `ingestNormalizedJob` upserts by the existing `opportunityFingerprint` (so the same role surfacing from two sources collapses into one row), writes new discoveries to the `discovered` application stage (distinct from Phase 4's manual-capture `saved`, so they queue for triage instead of looking already-decided), and reuses `scoreOpportunity`/`buildJobScoreRow` — the exact same hard-exclusion and scoring path the manual capture action uses. `runDiscoveryForSource` records every run in `source_runs` (success or error) and expires (`active = false`) any previously-active opportunity from that source no longer present in the current run.
- **`findOrCreateCompany` moved from `src/app/(app)/recruiting/company-helpers.ts` to `src/lib/companies.ts`** so both the manual capture action and the discovery pipeline can call it; same for a new `getTargetGradYear` helper (`src/lib/recruiting-preferences.ts`) and a shared `buildJobScoreRow` (`src/lib/job-scoring.ts`) — no behavior change, just de-duplicating what would otherwise be copy-pasted between the two ingestion paths.
- **Scheduling: Vercel Cron, not Supabase Edge Functions.** PLAN.md §4 named either as an option; Vercel Cron hitting a normal Next.js route handler (`/api/cron/discover-jobs`, `vercel.json`) reuses the same server code/deploy pipeline instead of a second runtime, which fits "low maintenance" better for a single-user app. The route checks `Authorization: Bearer $CRON_SECRET` (Vercel sends this automatically for scheduled invocations once `CRON_SECRET` is set) and runs via a new service-role client (`src/lib/supabase/service.ts`) since a scheduled job has no user session — the one addition to `src/lib/env.ts`/`.env.example` this task needed.
- **The auth proxy (`src/lib/supabase/middleware.ts`, formerly `middleware.ts` — Next 16 renamed the convention) was redirecting `/api/cron/*` to `/login`** before the route handler ever ran, since it treated "no Supabase session" as "redirect," with no exception for routes that authenticate a different way. Fixed with a `BEARER_AUTH_PATHS` bypass list. Caught during live verification, not by the unit suite — worth calling out since it's exactly the kind of bug that only shows up hitting the real route.
- **Verification**: unit tests (26 for the adapters/classification/ingest/run-discovery pipeline, fixture-based, network-independent) plus a full live round trip through the running dev server — inserted a real `source_configs` row pointing at Airbnb's live Greenhouse board, hit `/api/cron/discover-jobs` for real, confirmed one real opportunity ("Sales Operations Intern, Italy") landed with a correct `job_scores` row and a `discovered`-stage application, re-ran it to confirm idempotency (0 created, 1 updated, 0 duplicates), confirmed the bearer-auth guard 401s on missing/wrong secrets while `/recruiting` is still session-redirected, then deleted all of it. `npx tsc --noEmit`, `eslint`, and `next build` are all clean.
