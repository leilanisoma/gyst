-- Phase 9A: lightweight wellness check-in, distinct from the Phase 2
-- `check_ins` table (which feeds the scheduler's daily capacity). This one
-- is purely supportive/subjective per PLAN.md §11 and is never read by any
-- chat tool (docs/DATA_CLASSIFICATION.md, health-exclusion.test.ts).
-- Recovery: `drop table if exists public.wellness_check_ins cascade;`

create table if not exists public.wellness_check_ins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  check_in_date date not null default current_date,
  energy text check (energy in ('low', 'medium', 'high')),
  mood text check (mood in ('great', 'okay', 'low', 'rough')),
  stress text check (stress in ('low', 'medium', 'high')),
  sleep_perception text check (sleep_perception in ('great', 'okay', 'poor')),
  ate_consistently text check (
    ate_consistently in ('yes', 'somewhat', 'no', 'prefer_not_to_say')
  ),
  recovery text check (recovery in ('great', 'okay', 'poor')),
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, check_in_date)
);

create index if not exists wellness_check_ins_user_id_idx
  on public.wellness_check_ins (user_id);

alter table public.wellness_check_ins enable row level security;

create policy "wellness_check_ins_all_own" on public.wellness_check_ins for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create trigger wellness_check_ins_set_updated_at
  before update on public.wellness_check_ins
  for each row execute function public.set_updated_at();
