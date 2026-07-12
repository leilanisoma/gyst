-- Phase 2: daily check-in (mood/energy/stress/sleep) and capacity setting.
-- Recovery: `drop table if exists public.check_ins cascade;`

create table if not exists public.check_ins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  check_in_date date not null default current_date,
  mood text check (mood in ('great', 'okay', 'low', 'rough')),
  energy text check (energy in ('low', 'medium', 'high')),
  stress text check (stress in ('low', 'medium', 'high')),
  sleep_perception text check (sleep_perception in ('great', 'okay', 'poor')),
  capacity_minutes integer check (capacity_minutes >= 0),
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, check_in_date)
);

create index if not exists check_ins_user_id_idx on public.check_ins (user_id);

alter table public.check_ins enable row level security;

create policy "check_ins_all_own" on public.check_ins for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create trigger check_ins_set_updated_at before update on public.check_ins
  for each row execute function public.set_updated_at();
