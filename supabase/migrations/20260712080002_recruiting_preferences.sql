-- Phase 4.4: editable job-scoring preferences (PLAN.md §9 — "let Ishani correct it").
-- Recovery: `alter table public.preferences drop column if exists recruiting_preferences;`

alter table public.preferences
  add column if not exists recruiting_preferences jsonb not null default '{"target_grad_year": 2027}'::jsonb;
