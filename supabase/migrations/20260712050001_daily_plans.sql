-- Phase 2: top-three daily outcomes. Scoped narrowly to what this task needs;
-- PLAN.md §6 mentions "mode" and "accepted version" on daily_plans, but
-- nothing built so far needs them — add when something actually does.
-- Recovery: `drop table if exists public.daily_plans cascade;`

create table if not exists public.daily_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  plan_date date not null default current_date,
  outcome_1 text,
  outcome_2 text,
  outcome_3 text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, plan_date)
);

create index if not exists daily_plans_user_date_idx
  on public.daily_plans (user_id, plan_date);

alter table public.daily_plans enable row level security;

create policy "daily_plans_all_own" on public.daily_plans for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create trigger daily_plans_set_updated_at before update on public.daily_plans
  for each row execute function public.set_updated_at();
