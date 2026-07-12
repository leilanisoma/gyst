-- Phase 5.1: source-adapter contract support — provenance columns on
-- opportunities, plus source_configs (which adapters/companies/feeds are
-- enabled) and source_runs (health check + provenance history per run).
-- Recovery: `drop table if exists public.source_runs, public.source_configs
-- cascade; alter table public.opportunities drop column if exists
-- external_id, drop column if exists last_seen_at, drop column if exists
-- feedback;`

alter table public.opportunities
  add column if not exists external_id text,
  add column if not exists last_seen_at timestamptz,
  add column if not exists feedback text
    check (feedback in ('up', 'down', 'not_relevant'));

create table if not exists public.source_configs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  adapter_id text not null check (adapter_id in ('greenhouse', 'lever', 'curated_feed')),
  label text not null,
  -- Adapter-specific config, e.g. {"slug": "stripe"} for Greenhouse/Lever or
  -- {"feedUrl": "...", "categories": ["Product"], "terms": ["Summer 2027"]}
  -- for the curated feed. Kept jsonb so adding an adapter never needs a
  -- schema change here, same rationale as integrations.settings in Phase 3.
  config jsonb not null default '{}'::jsonb,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.source_runs (
  id uuid primary key default gen_random_uuid(),
  source_config_id uuid not null references public.source_configs (id) on delete cascade,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  status text not null default 'running' check (status in ('running', 'success', 'error')),
  items_found integer not null default 0,
  items_created integer not null default 0,
  items_updated integer not null default 0,
  items_expired integer not null default 0,
  error text
);

create index if not exists source_configs_user_id_idx on public.source_configs (user_id);
create index if not exists source_runs_source_config_id_idx on public.source_runs (source_config_id);
create index if not exists opportunities_source_external_id_idx on public.opportunities (source, external_id);

alter table public.source_configs enable row level security;
alter table public.source_runs enable row level security;

create policy "source_configs_all_own" on public.source_configs for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- source_runs has no user_id column; ownership is derived through source_configs.
create policy "source_runs_all_own" on public.source_runs for all
  using (exists (
    select 1 from public.source_configs sc
    where sc.id = source_runs.source_config_id and sc.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.source_configs sc
    where sc.id = source_runs.source_config_id and sc.user_id = auth.uid()
  ));

create trigger source_configs_set_updated_at before update on public.source_configs
  for each row execute function public.set_updated_at();
