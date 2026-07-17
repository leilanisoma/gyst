-- Phase 9B (server-side foundation): the future SwiftUI companion's
-- credential exchange and the two Highly sensitive tables it will sync
-- into (docs/DATA_CLASSIFICATION.md anticipated both since Phase 8).
-- Recovery: `drop table if exists public.device_pairing_codes,
-- public.device_tokens, public.cycle_observations,
-- public.health_daily_summaries cascade;`

-- Short-lived, single-use code generated from an authenticated web session
-- (Settings) and redeemed by the native app to obtain a device_tokens row.
-- This *is* "sign in" for a single-user app: proving you already have
-- access to the signed-in web session is the credential.
create table if not exists public.device_pairing_codes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  code_hash text not null unique,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists device_pairing_codes_user_id_idx
  on public.device_pairing_codes (user_id);

-- The long-lived Bearer credential the native app stores (Keychain) and
-- sends to /api/health/sync. Only the SHA-256 hash is stored — the
-- plaintext token is returned once, at pairing-code redemption, and never
-- again (same "never store the raw value" rule as oauth_tokens/gmail
-- excerpts, hashed rather than reversibly encrypted since nothing here ever
-- needs to be decrypted back to plaintext).
create table if not exists public.device_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  label text,
  token_hash text not null unique,
  created_at timestamptz not null default now(),
  last_used_at timestamptz,
  revoked_at timestamptz
);

create index if not exists device_tokens_user_id_idx on public.device_tokens (user_id);

-- Only the daily-summary fields PLAN.md §8 names ("sleep, workouts,
-- activity, resting heart rate") — an explicit allowlist enforced again in
-- application code (src/lib/health/daily-summaries.ts), never an open-ended
-- HealthKit dump.
create table if not exists public.health_daily_summaries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  summary_date date not null,
  sleep_minutes integer check (sleep_minutes is null or sleep_minutes >= 0),
  steps integer check (steps is null or steps >= 0),
  resting_heart_rate integer check (resting_heart_rate is null or resting_heart_rate >= 0),
  active_energy_kcal numeric check (active_energy_kcal is null or active_energy_kcal >= 0),
  workout_minutes integer check (workout_minutes is null or workout_minutes >= 0),
  source text not null default 'healthkit',
  synced_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, summary_date)
);

create index if not exists health_daily_summaries_user_id_idx
  on public.health_daily_summaries (user_id);

-- Only fields Ishani explicitly selects (PLAN.md §6/§11): flow level and a
-- fixed symptom vocabulary, both plain columns since they're just enum-ish
-- values; free text goes in note_encrypted (AES-256-GCM, same as
-- gmail_items.excerpt_encrypted) since that's the one field a diary-style
-- entry could actually leak. `source` records whether a row came from
-- manual entry or the manual/CSV import path PLAN.md §8 requires in place
-- of assuming a Mira API.
create table if not exists public.cycle_observations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  observation_date date not null,
  flow text check (flow in ('none', 'spotting', 'light', 'medium', 'heavy')),
  symptoms text[] not null default '{}',
  note_encrypted text,
  source text not null default 'manual_entry'
    check (source in ('manual_entry', 'manual_csv')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, observation_date)
);

create index if not exists cycle_observations_user_id_idx
  on public.cycle_observations (user_id);

alter table public.device_pairing_codes enable row level security;
alter table public.device_tokens enable row level security;
alter table public.health_daily_summaries enable row level security;
alter table public.cycle_observations enable row level security;

-- Device auth tables have no client-facing policy beyond "own rows" — every
-- real read/write against them happens server-side via the service-role
-- client (there's no Supabase Auth session on a device-token request), but
-- RLS still applies if a browser session ever queries them directly (e.g.
-- the Settings device list).
create policy "device_pairing_codes_all_own" on public.device_pairing_codes for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "device_tokens_all_own" on public.device_tokens for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "health_daily_summaries_all_own" on public.health_daily_summaries for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "cycle_observations_all_own" on public.cycle_observations for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create trigger health_daily_summaries_set_updated_at
  before update on public.health_daily_summaries
  for each row execute function public.set_updated_at();

create trigger cycle_observations_set_updated_at
  before update on public.cycle_observations
  for each row execute function public.set_updated_at();
