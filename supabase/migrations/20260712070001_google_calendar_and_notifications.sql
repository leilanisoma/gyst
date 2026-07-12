-- Phase 3: Google Calendar integration, sync bookkeeping, notification center,
-- and web push. Recovery: `drop table if exists public.push_subscriptions,
-- public.notifications, public.events, public.sync_runs, public.oauth_tokens,
-- public.integrations cascade; alter table public.time_block_suggestions
-- drop column if exists google_event_id;`

create table if not exists public.integrations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  provider text not null check (provider in ('google')),
  status text not null default 'not_connected'
    check (status in ('not_connected', 'connected', 'error')),
  granted_scopes text[] not null default '{}',
  account_email text,
  -- Provider-specific bookkeeping: which calendar IDs feed the scheduler as
  -- fixed commitments, and the ID of the dedicated GYST write calendar once
  -- created. Keeping this as jsonb avoids a schema change per provider quirk.
  settings jsonb not null default '{}'::jsonb,
  last_synced_at timestamptz,
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, provider)
);

create table if not exists public.oauth_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  provider text not null check (provider in ('google')),
  -- AES-256-GCM ciphertext (base64 iv:tag:ciphertext), never plaintext.
  -- Server-only: no RLS select policy is granted to the client role.
  access_token_encrypted text not null,
  refresh_token_encrypted text,
  expires_at timestamptz not null,
  scope text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, provider)
);

create table if not exists public.sync_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  provider text not null check (provider in ('google')),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  status text not null default 'running'
    check (status in ('running', 'success', 'error')),
  sync_token text,
  events_created integer not null default 0,
  events_updated integer not null default 0,
  events_deleted integer not null default 0,
  error text,
  retry_count integer not null default 0
);

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  kind text not null default 'fixed' check (kind in ('fixed', 'flexible')),
  start_at timestamptz not null,
  end_at timestamptz not null,
  all_day boolean not null default false,
  location text,
  travel_buffer_minutes integer not null default 0,
  time_zone text,
  calendar_id text,
  is_fixed_commitment boolean not null default false,
  source text not null default 'google' check (source in ('google', 'manual')),
  source_id text,
  recurring_source_id text,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint events_time_order check (end_at > start_at)
);

create unique index if not exists events_user_source_idx
  on public.events (user_id, source, source_id) where source_id is not null;
create index if not exists events_user_start_idx on public.events (user_id, start_at);

alter table public.time_block_suggestions
  add column if not exists google_event_id text;

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  kind text not null default 'info'
    check (kind in ('info', 'sync_error', 'deadline', 'block_reminder')),
  title text not null,
  body text,
  link text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_created_idx
  on public.notifications (user_id, created_at desc);

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now(),
  unique (user_id, endpoint)
);

alter table public.integrations enable row level security;
alter table public.oauth_tokens enable row level security;
alter table public.sync_runs enable row level security;
alter table public.events enable row level security;
alter table public.notifications enable row level security;
alter table public.push_subscriptions enable row level security;

create policy "integrations_all_own" on public.integrations for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- oauth_tokens: server-only. RLS still scopes by owner (defense in depth),
-- but the app must only ever read/write this table from server code using
-- the user's session — never expose these rows to client-side fetches.
create policy "oauth_tokens_all_own" on public.oauth_tokens for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "sync_runs_all_own" on public.sync_runs for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "events_all_own" on public.events for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "notifications_all_own" on public.notifications for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "push_subscriptions_all_own" on public.push_subscriptions for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create trigger integrations_set_updated_at before update on public.integrations
  for each row execute function public.set_updated_at();
create trigger oauth_tokens_set_updated_at before update on public.oauth_tokens
  for each row execute function public.set_updated_at();
create trigger events_set_updated_at before update on public.events
  for each row execute function public.set_updated_at();
