-- Phase 1: inbox, tasks, projects, goals, and settings (preferences) schema.
-- Recovery: `drop table if exists public.tasks, public.inbox_items,
-- public.projects, public.goals, public.preferences cascade;`

create table if not exists public.preferences (
  id uuid primary key references public.profiles (id) on delete cascade,
  working_hours_start time not null default '09:00',
  working_hours_end time not null default '18:00',
  buffer_minutes integer not null default 15,
  notification_rules jsonb not null default '{}'::jsonb,
  ai_daily_token_limit integer,
  ai_daily_dollar_limit numeric(6, 2),
  theme text not null default 'cozy',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.inbox_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  raw_text text not null,
  status text not null default 'inbox' check (status in ('inbox', 'converted', 'archived')),
  source text not null default 'manual',
  converted_to text check (converted_to in ('task', 'note', 'goal')),
  converted_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  description text,
  area text not null default 'general',
  status text not null default 'active' check (status in ('active', 'completed', 'archived')),
  target_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  horizon text not null default 'weekly' check (horizon in ('daily', 'weekly', 'term', 'long_term')),
  success_definition text,
  progress_type text not null default 'binary' check (progress_type in ('binary', 'numeric', 'percentage')),
  target_date date,
  status text not null default 'active' check (status in ('active', 'completed', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  notes text,
  area text not null default 'general',
  status text not null default 'not_started' check (status in ('not_started', 'in_progress', 'completed')),
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high')),
  estimated_minutes integer,
  energy text check (energy in ('low', 'medium', 'high')),
  due_date timestamptz,
  earliest_start timestamptz,
  source text not null default 'manual',
  source_inbox_item_id uuid references public.inbox_items (id) on delete set null,
  project_id uuid references public.projects (id) on delete set null,
  goal_id uuid references public.goals (id) on delete set null,
  rollover_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists inbox_items_user_id_idx on public.inbox_items (user_id);
create index if not exists projects_user_id_idx on public.projects (user_id);
create index if not exists goals_user_id_idx on public.goals (user_id);
create index if not exists tasks_user_id_idx on public.tasks (user_id);
create index if not exists tasks_status_idx on public.tasks (user_id, status);

alter table public.preferences enable row level security;
alter table public.inbox_items enable row level security;
alter table public.projects enable row level security;
alter table public.goals enable row level security;
alter table public.tasks enable row level security;

create policy "preferences_select_own" on public.preferences for select using (auth.uid() = id);
create policy "preferences_insert_own" on public.preferences for insert with check (auth.uid() = id);
create policy "preferences_update_own" on public.preferences for update using (auth.uid() = id) with check (auth.uid() = id);

create policy "inbox_items_all_own" on public.inbox_items for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "projects_all_own" on public.projects for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "goals_all_own" on public.goals for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "tasks_all_own" on public.tasks for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create trigger preferences_set_updated_at before update on public.preferences
  for each row execute function public.set_updated_at();
create trigger inbox_items_set_updated_at before update on public.inbox_items
  for each row execute function public.set_updated_at();
create trigger projects_set_updated_at before update on public.projects
  for each row execute function public.set_updated_at();
create trigger goals_set_updated_at before update on public.goals
  for each row execute function public.set_updated_at();
create trigger tasks_set_updated_at before update on public.tasks
  for each row execute function public.set_updated_at();

-- Seed a default preferences row alongside the profile row.
create or replace function public.handle_new_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.preferences (id) values (new.id);
  return new;
end;
$$;

drop trigger if exists on_profile_created on public.profiles;

create trigger on_profile_created
  after insert on public.profiles
  for each row execute function public.handle_new_profile();
