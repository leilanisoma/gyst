# Phase 11 — Automations reliability: migrate scheduling to Supabase pg_cron

Source: `PLAN.md` §15, Phase 11. Do this before the remaining 9D room-visual
work (Ishani, 2026-07-21) — it's a silent correctness gap, not polish.

## Why

`vercel.json` currently schedules five cron jobs — `discover-jobs`,
`weekly-digest`, `sync-canvas`, `sync-gmail`, `purge-gmail-items` — but the
Vercel Hobby plan caps cron at **2 jobs/day**. `docs/PHASES/phase-10.md`
flagged this 2026-07-20 and left it unresolved: at most two of the five are
actually firing on schedule right now, and which two depends on Vercel's own
enforcement behavior, not anything in this repo. Decided 2026-07-21: move
scheduling to Supabase `pg_cron`/`pg_net` rather than upgrading to Vercel
Pro — no ongoing cost, and every route already authenticates via a
`CRON_SECRET` bearer header (`getCronEnv()`, checked identically in all five
routes), which `net.http_post` can send without touching route code at all.

## Checklist

- [ ] Write `docs/DECISIONS/0005-pg-cron-scheduling.md` — approach and where
      the secret lives (Supabase Vault vs. a config table read at schedule
      time).
- [ ] Migration: enable the `pg_cron` and `pg_net` extensions.
- [ ] Migration: one `cron.schedule()` per route, each calling `net.http_post`
      against the existing `/api/cron/*` path with the same
      `Authorization: Bearer $CRON_SECRET` header the routes already expect.
      Cadence no longer has to be daily-only — pick what's actually right per
      job (e.g. `sync-gmail` more than once a day if useful).
- [ ] Remove the five entries from `vercel.json` once pg_cron is confirmed
      driving all five routes end to end.
- [ ] Verify each job by its actual effect, not just an HTTP 200: new rows in
      the jobs-discovery table, new synced Gmail items, new synced Canvas
      items, an actually-delivered weekly digest, purged expired Gmail items.
- [ ] Add minimal last-run visibility (a small `cron_runs` table, or reuse the
      Phase 5 source-adapter health-check pattern) so a broken job is visible
      without grepping logs — the whole point of this phase is that the
      current setup fails silently.

## Exit criteria

> All five automations run on their intended schedule, each verified against
> a real data change it should have caused; if one breaks again, it's visible
> without manually checking logs.

## Session — 2026-07-21

Cadences changed per Ishani's direction: calendar nightly (previously not
automated at all — only a manual "sync now" button on Settings), Gmail
hourly (was daily), Canvas daily (unchanged), internship/job discovery every
3 hours (was daily). Also added a new automation that was already
half-scaffolded: `notifications.kind = 'deadline'` has existed since Phase 3
but nothing ever created one — added `deadline-reminders`, a daily job that
scans `tasks.due_date` (the universal board, so it covers recruiting
next-actions and school assessments too, not just plain to-dos) for anything
due within 24h and not yet notified.

**Code written this session:**
- `src/app/api/cron/sync-calendar/route.ts` (new) — calls `runGoogleSync`.
- `src/app/api/cron/deadline-reminders/route.ts` (new) + `src/lib/tasks-deadline-reminders.ts` (new, tested) — calls `createNotification` with `kind: "deadline"`.
- `tasks.deadline_notified_at` column (new, dedup guard so the job can safely run more than once).
- `supabase/migrations/20260721000001_pg_cron_setup.sql`, `20260721000002_schedule_cron_jobs.sql` — enable `pg_cron`/`pg_net`, schedule all seven jobs (five existing + calendar + deadline-reminders) via `net.http_get` against the existing routes, secret pulled from Vault by name so it's never committed.
- `docs/DECISIONS/0005-pg-cron-scheduling.md` — full rationale.

**Not done yet — requires Ishani, no DB/CLI credentials in this sandbox:**
- [ ] Confirm the production domain baked into `20260721000002_schedule_cron_jobs.sql` (currently `ishanigyst.vercel.app`, unverified this session).
- [ ] One-time manual step: `select vault.create_secret('<real CRON_SECRET>', 'cron_secret');` via the Supabase SQL Editor — deliberately never passed through this session.
- [ ] Apply both migrations to the hosted project (SQL Editor, or `supabase db push` after `supabase login` + `supabase link`).
- [ ] If `create extension pg_cron;` errors on permissions, enable it via the dashboard's Database → Extensions toggle first, then re-run.
- [ ] Verify each of the 7 jobs actually fires — `select * from cron.job;` for schedules, `select * from cron.job_run_details order by start_time desc limit 20;` for run history/status (this is pg_cron's built-in observability; no separate table was added for it).
- [ ] Once confirmed, remove the five old entries from `vercel.json`.
