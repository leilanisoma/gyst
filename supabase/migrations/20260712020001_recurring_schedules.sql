-- Phase 2: manual recurring class and fencing schedules (weekly fixed commitments).
-- Recovery: `drop table if exists public.recurring_schedules cascade;`

create table if not exists public.recurring_schedules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  category text not null default 'class' check (category in ('class', 'fencing', 'other')),
  day_of_week integer not null check (day_of_week between 0 and 6),
  start_time time not null,
  end_time time not null,
  location text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint recurring_schedules_time_order check (end_time > start_time)
);

create index if not exists recurring_schedules_user_id_idx on public.recurring_schedules (user_id);

alter table public.recurring_schedules enable row level security;

create policy "recurring_schedules_all_own" on public.recurring_schedules for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create trigger recurring_schedules_set_updated_at before update on public.recurring_schedules
  for each row execute function public.set_updated_at();
