-- Phase 6 task 6.4: Canvas-derived assessment candidates need to remember a
-- dismissal permanently (a daily cron re-sync must not resurrect a
-- candidate the user already rejected), and never be recreated twice for
-- the same assignment. Recovery: `alter table public.assessments drop
-- column if exists dismissed_at; alter table public.assessments drop
-- constraint if exists assessments_user_assignment_key;`

alter table public.assessments add column if not exists dismissed_at timestamptz;

alter table public.assessments add constraint assessments_user_assignment_key
  unique (user_id, assignment_id);
