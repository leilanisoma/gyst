# Phase 5 — Recruiting discovery automation

Goal: collect high-quality summer 2027 roles without fragile dependence on
one board. Source: `PLAN.md` §15, §8, §9.

## Checklist (task IDs map 1:1 to PLAN.md §15 Phase 5 bullets)

- [x] 5.1 Source-adapter contract, fixtures, health checks, and provenance.
- [x] 5.2 Small list of target-company ATS sources (Greenhouse, Lever).
- [x] 5.3 Public/curated internship feed with terms review.
- [ ] 5.4 Schedule daily discovery, normalization, deduplication, and expiry checks.
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
- **Two real, unauthenticated ATS adapters**: Greenhouse (`boards-api.greenhouse.io`) and Lever (`api.lever.co`) — both public read APIs with no ToS restriction on this kind of access, matching PLAN.md §8 source order #1. `discover()` filters to titles matching `/intern/i` before normalizing, since an unfiltered company board is mostly full-time roles irrelevant to a Summer 2027 internship search.
- **Curated feed adapter (task 5.3) reads Pitt CSC/Simplify's `Summer2026-Internships` `listings.json`** — a public, unauthenticated file the repo generates specifically for programmatic consumption (other tools like swelist.com already consume it the same way). Terms review: no auth wall, no robots restriction on raw.githubusercontent.com, and the repo's own README advertises third-party tools built on this feed. The repo gets renamed each cycle (there's no `Summer2027-Internships` repo yet as of 2026-07-12, though the current repo already carries some `"Summer 2027"`-tagged listings) — `feedUrl` lives in `source_configs.config` so switching repos next cycle is a config edit, not a code change. Default filters: category `"Product"`, term `"Summer 2027"`.
- **Verification**: 19 unit tests against fixture payloads shaped from real API responses (confirmed live via `curl` against `boards-api.greenhouse.io/v1/boards/airbnb`, `api.lever.co/v0/postings/zoox`, and the live `listings.json` during development — not part of the automated suite, since tests must stay network-independent). `npx tsc --noEmit` is clean.
