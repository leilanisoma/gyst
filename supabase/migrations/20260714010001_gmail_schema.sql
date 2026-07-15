-- Phase 7 (tasks 7.4-7.8): Gmail extraction review queue, message-processed
-- bookkeeping (so re-syncing never re-extracts the same message), and
-- draft-only reply/follow-up tracking. Recovery: `drop table if exists
-- public.gmail_drafts, public.gmail_processed_messages, public.gmail_items
-- cascade;`

create table if not exists public.gmail_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  gmail_message_id text not null,
  gmail_thread_id text not null,
  kind text not null
    check (kind in ('interview', 'confirmation', 'deadline', 'action', 'other')),
  title text not null,
  -- AES-256-GCM ciphertext of a short excerpt (never the full message body —
  -- docs/DATA_CLASSIFICATION.md marks Gmail content Highly sensitive with
  -- "no full mailbox storage"). Nullable since not every candidate needs one.
  excerpt_encrypted text,
  date_at timestamptz,
  requested_action text,
  confidence numeric check (confidence is null or (confidence >= 0 and confidence <= 1)),
  confirmed boolean not null default false,
  dismissed_at timestamptz,
  -- Retention (task 7.8): purged by /api/cron/purge-gmail-items once past this.
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists gmail_items_user_review_idx
  on public.gmail_items (user_id, confirmed, dismissed_at);
create index if not exists gmail_items_expires_idx on public.gmail_items (expires_at);

-- No content, just IDs — lets a sync skip messages it already extracted from
-- without ever storing/re-fetching the message body to check.
create table if not exists public.gmail_processed_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  gmail_message_id text not null,
  processed_at timestamptz not null default now(),
  unique (user_id, gmail_message_id)
);

create table if not exists public.gmail_drafts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  gmail_item_id uuid references public.gmail_items (id) on delete set null,
  gmail_thread_id text not null,
  in_reply_to_message_id text not null,
  subject text not null,
  content text not null default '',
  -- 'proposed': only exists in GYST. 'created': pushed to the real Gmail
  -- drafts folder via the API — still requires the user to open Gmail and
  -- hit Send themselves; this app never calls a send endpoint.
  status text not null default 'proposed' check (status in ('proposed', 'created')),
  gmail_draft_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists gmail_drafts_user_id_idx on public.gmail_drafts (user_id);

alter table public.gmail_items enable row level security;
alter table public.gmail_processed_messages enable row level security;
alter table public.gmail_drafts enable row level security;

create policy "gmail_items_all_own" on public.gmail_items for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "gmail_processed_messages_all_own" on public.gmail_processed_messages for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "gmail_drafts_all_own" on public.gmail_drafts for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create trigger gmail_items_set_updated_at before update on public.gmail_items
  for each row execute function public.set_updated_at();
create trigger gmail_drafts_set_updated_at before update on public.gmail_drafts
  for each row execute function public.set_updated_at();
