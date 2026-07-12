-- Phase 2: calm gamification — an append-only XP ledger, no streaks/leaderboards.
-- Recovery: `drop table if exists public.xp_events cascade;`

create table if not exists public.xp_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  event_type text not null check (event_type in (
    'capture', 'check_in', 'set_outcomes', 'accept_block', 'finish_block',
    'review_overdue', 'return_from_absence'
  )),
  points integer not null,
  occurred_on date not null default current_date,
  created_at timestamptz not null default now()
);

create index if not exists xp_events_user_date_idx on public.xp_events (user_id, occurred_on);

alter table public.xp_events enable row level security;

create policy "xp_events_all_own" on public.xp_events for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
