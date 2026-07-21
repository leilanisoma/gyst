-- Phase 11: move cron scheduling off Vercel (Hobby caps at 2 jobs/day) onto
-- Supabase pg_cron/pg_net, which can call the existing /api/cron/* routes on
-- any schedule. See docs/PHASES/phase-11.md and
-- docs/DECISIONS/0005-pg-cron-scheduling.md.

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Dedup guard for the new deadline-reminder cron job (src/lib/tasks-deadline-reminders.ts):
-- lets the job run more than once without re-notifying the same task.
alter table public.tasks
  add column if not exists deadline_notified_at timestamptz;
