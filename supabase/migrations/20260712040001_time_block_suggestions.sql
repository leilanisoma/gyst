-- Phase 2: editable time-block suggestions produced by the scheduling engine.
-- Recovery: `drop table if exists public.time_block_suggestions cascade;`

create table if not exists public.time_block_suggestions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  task_id uuid not null references public.tasks (id) on delete cascade,
  suggestion_date date not null default current_date,
  start_at timestamptz not null,
  end_at timestamptz not null,
  score numeric not null default 0,
  status text not null default 'proposed' check (status in ('proposed', 'accepted', 'dismissed')),
  explanation text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint time_block_suggestions_time_order check (end_at > start_at)
);

create index if not exists time_block_suggestions_user_date_idx
  on public.time_block_suggestions (user_id, suggestion_date);

alter table public.time_block_suggestions enable row level security;

create policy "time_block_suggestions_all_own" on public.time_block_suggestions for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create trigger time_block_suggestions_set_updated_at before update on public.time_block_suggestions
  for each row execute function public.set_updated_at();
