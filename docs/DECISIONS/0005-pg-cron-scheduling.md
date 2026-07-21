# 0005 — Move cron scheduling to Supabase pg_cron

**Date:** 2026-07-21
**Status:** Accepted

## Context

`vercel.json` scheduled five cron jobs (`discover-jobs`, `weekly-digest`,
`sync-canvas`, `sync-gmail`, `purge-gmail-items`) plus a sixth that never
existed at all — Google Calendar sync (`runGoogleSync`) had no automation
whatsoever, only a manual "sync now" button on Settings. The Vercel Hobby
plan caps cron at **2 jobs/day**, so at most two of the five configured jobs
were actually firing; which two depends on Vercel's own enforcement, not
anything visible in this repo. Flagged 2026-07-20 in
`docs/PHASES/phase-10.md`, unresolved until now.

Ishani's requested cadences (2026-07-21) exceed daily-only regardless of the
job-count cap: Gmail hourly, job discovery every 3 hours. Vercel Hobby cron
is daily-only, so an upgrade to Pro wouldn't even be sufficient on its own —
Pro's minimum cron interval is also coarser than hourly on some plans, and
either way it's an ongoing cost for something Postgres can already do.

## Decision

Move all scheduling to Supabase **pg_cron** + **pg_net**:

- `pg_cron` schedules a SQL statement on a cron expression, no interval
  floor beyond one minute.
- `pg_net` makes an async HTTP call from inside Postgres — used here to hit
  the exact same `/api/cron/*` GET routes Vercel Cron used to call, with the
  same `Authorization: Bearer $CRON_SECRET` header those routes already
  check via `getCronEnv()`. **No route code changed.**
- The secret is stored once via Supabase Vault (`vault.create_secret`) and
  looked up by name (`vault.decrypted_secrets`) inside each scheduled
  statement, so the real value is never written into a migration file or
  committed to git.

Rejected: upgrading to Vercel Pro. It removes the 2-job cap but doesn't
obviously support hourly/every-3-hours cadences on Hobby-adjacent tiers
either, and costs money on an ongoing basis for a single-user app — pg_cron
does the same job for free within the existing Supabase project.

## Schedule (see `supabase/migrations/20260721000002_schedule_cron_jobs.sql`)

| Job | Old cadence | New cadence |
|---|---|---|
| `sync-calendar` (new route) | never scheduled | nightly |
| `sync-gmail` | daily | hourly |
| `sync-canvas` | daily | daily (unchanged) |
| `discover-jobs` | daily | every 3 hours |
| `weekly-digest` | weekly (Monday) | weekly (unchanged) |
| `purge-gmail-items` | daily | daily (unchanged) |
| `deadline-reminders` (new route) | did not exist | daily |

`deadline-reminders` is new: `notifications.kind = 'deadline'` existed as a
schema value since Phase 3 but nothing ever created one. It scans
`tasks.due_date` (the universal board — recruiting next-actions and school
assessments already flow into `tasks` per PLAN.md §7, so one query covers
all areas) for anything due within 24h that hasn't been notified yet
(`tasks.deadline_notified_at is null`, new column, set once notified so
re-running the job never double-sends).

## Consequences

- `vercel.json`'s five cron entries get removed once the pg_cron jobs are
  confirmed firing (kept temporarily as a fallback during cutover).
- Observability: rather than a new bespoke table, use pg_cron's own
  `cron.job_run_details` (joined to `cron.job` by `jobid`) to see each run's
  status/timing — it already exists once the extension is enabled.
- Manual one-time setup step required outside of any migration (see the
  comment at the top of `20260721000002_schedule_cron_jobs.sql`): insert the
  real `CRON_SECRET` value into Vault via the Supabase SQL Editor.
- pg_cron may require enabling via the Supabase dashboard's Database →
  Extensions UI rather than raw SQL on some project tiers — if
  `create extension pg_cron;` fails with a permissions error, use the
  dashboard toggle instead, then re-run the rest of the migration.
