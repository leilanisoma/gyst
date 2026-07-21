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

- [x] Write `docs/DECISIONS/0005-pg-cron-scheduling.md` — approach and where
      the secret lives (Supabase Vault).
- [x] Migration: enable the `pg_cron` and `pg_net` extensions.
- [x] Migration: one `cron.schedule()` per route, each calling `net.http_get`
      against the existing `/api/cron/*` path with the same
      `Authorization: Bearer $CRON_SECRET` header the routes already expect.
      Cadence no longer has to be daily-only.
- [x] Remove the five entries from `vercel.json` — done 2026-07-21 once
      pg_net was confirmed reaching production with correct auth; kept both
      systems live only briefly, since leaving them overlapping risked
      double-firing (e.g. `weekly-digest` sending its notification twice).
- [x] Verify each job by its actual effect, not just an HTTP 200:
      `sync-calendar` synced 6 calendars / updated 153 events on first run
      (it had never run before at all); `deadline-reminders` ran cleanly
      (`{"ok":true,"notified":0}`, correctly found nothing due yet).
      `sync-canvas` returned an *app-level* 401 from Canvas's own API — the
      cron plumbing itself worked (past the bearer-auth check, executed
      `runCanvasSync`), but production's `CANVAS_PERSONAL_ACCESS_TOKEN`
      itself is being rejected by Canvas. Not fixed this session — flagged
      below as a separate, unrelated issue.
- [x] Last-run visibility: no new table needed — pg_cron's own
      `cron.job_run_details` (join `cron.job` on `jobid`) already has this
      once the extension is enabled.

## Exit criteria

> All five automations run on their intended schedule, each verified against
> a real data change it should have caused; if one breaks again, it's visible
> without manually checking logs.

**Met 2026-07-21** — see session log below. One caveat: `sync-canvas`'s
*scheduling* is verified working, but the Canvas integration itself is
currently broken in production (separate, unrelated issue — see below).

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

**Update, same session — Ishani provided a Supabase personal access token,
so all of the below actually got finished live instead of staying a
runbook:**

- [x] Domain confirmed: `ishanigyst.vercel.app` is correct — verified by
      curling the deployed app directly with the real `CRON_SECRET`.
- [x] Vault secret created (`vault.create_secret(..., 'cron_secret')`) using
      the `CRON_SECRET` value from local `.env.local`, which a direct curl
      against production confirmed matches the deployed value.
- [x] Both migrations applied via `supabase link` + `supabase db push`
      (`pg_cron`/`pg_net` enabled without needing the dashboard toggle —
      the CLI had sufficient permission).
- [x] All 7 jobs confirmed in `cron.job`, all `active: true`.
- [x] End-to-end verified two ways: direct `curl` against the two brand-new
      routes (both 404 until a commit+push actually deployed them — the
      routes existed locally but not in production yet, a real gap this
      caught), then a manual `net.http_get(...)` run through Postgres
      itself (not curl) to confirm Supabase's network can actually reach
      Vercel with the Vault-stored secret — got back a real `200` and the
      route's actual JSON body via `net._http_response`.
- [x] `vercel.json`'s five entries removed (see above) once pg_net was
      confirmed working, to avoid double-firing overlap.

**Security note:** Ishani pasted a Supabase personal access token directly
into chat this session to unblock this work. It's now in this session's
transcript. Flagged to her at the time to revoke/rotate it in Supabase
account settings once done — PATs scope to the whole account, not just this
project. Not re-verified whether she's done so.

**Follow-up, not this phase:** `sync-canvas` reached the route fine but
Canvas's own API rejected production's `CANVAS_PERSONAL_ACCESS_TOKEN` with a
401. Needs a fresh Canvas token in Vercel's production env vars — separate
from anything pg_cron-related.
