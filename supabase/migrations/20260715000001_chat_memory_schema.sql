-- Phase 8: universal chatbot + durable memory (PLAN.md §6 "Chat and
-- memory", §12, §15 Phase 8). Adds pgvector, conversation/message history,
-- reviewable memory with semantic search, document chunk embeddings for
-- retrieval-with-citations, proposed/approved assistant actions, and AI
-- token-usage tracking. Recovery: `drop table if exists
-- public.ai_usage_events, public.document_chunks, public.assistant_actions,
-- public.memory_links, public.memory_items, public.messages,
-- public.conversations cascade; drop function if exists
-- public.match_memory_items, public.match_document_chunks;`

create extension if not exists vector;

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null default 'New conversation',
  -- AI-written summary of messages older than the compaction cutoff (task
  -- 8.7) — no FK to messages to avoid a circular table dependency; it's a
  -- point-in-time snapshot, not a live reference.
  summary text,
  summary_through_created_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists conversations_user_id_idx on public.conversations (user_id, updated_at desc);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  -- Denormalized from conversations.user_id so RLS doesn't need a join.
  user_id uuid not null references public.profiles (id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'tool')),
  content text not null default '',
  -- Present on an 'assistant' message that requested tool calls:
  -- [{id, name, args}]. Executed before the next 'tool' message(s) exist.
  tool_calls jsonb,
  -- Present on a 'tool' message: which call this result answers.
  tool_call_id text,
  tool_name text,
  input_tokens integer,
  output_tokens integer,
  created_at timestamptz not null default now()
);

create index if not exists messages_conversation_id_idx on public.messages (conversation_id, created_at);
create index if not exists messages_user_id_idx on public.messages (user_id);

create table if not exists public.memory_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  kind text not null check (kind in ('fact', 'preference', 'goal', 'decision')),
  text text not null,
  -- text-embedding-004 output dimension (src/ai/providers/gemini.ts).
  embedding vector(768),
  confidence numeric check (confidence is null or (confidence >= 0 and confidence <= 1)),
  -- 'explicit': user said "remember this". 'model_suggested': the assistant
  -- proposed it from conversation context. Both land in the same
  -- reviewable queue (PLAN.md §12 memory policy) — this column is
  -- provenance, not an auto-confirm bypass.
  source text not null check (source in ('explicit', 'model_suggested')),
  source_message_id uuid references public.messages (id) on delete set null,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'archived', 'deleted')),
  learned_at timestamptz not null default now(),
  last_used_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists memory_items_user_status_idx on public.memory_items (user_id, status);

create table if not exists public.memory_links (
  id uuid primary key default gen_random_uuid(),
  memory_item_id uuid not null references public.memory_items (id) on delete cascade,
  linked_table text not null,
  linked_id uuid not null,
  created_at timestamptz not null default now(),
  unique (memory_item_id, linked_table, linked_id)
);

create index if not exists memory_links_memory_item_id_idx on public.memory_links (memory_item_id);

create table if not exists public.assistant_actions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  conversation_id uuid references public.conversations (id) on delete set null,
  source_message_id uuid references public.messages (id) on delete set null,
  -- Fixed allowlist (PLAN.md §14 "must never send messages/applications or
  -- write to an external calendar without explicit approval") — internal
  -- writes only; expand deliberately, one type at a time.
  action_type text not null check (action_type in ('create_task', 'update_task', 'create_goal')),
  arguments jsonb not null,
  preview text not null,
  status text not null default 'proposed' check (status in ('proposed', 'approved', 'rejected', 'executed', 'failed')),
  result jsonb,
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists assistant_actions_user_status_idx on public.assistant_actions (user_id, status);

create table if not exists public.document_chunks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  document_id uuid not null references public.documents (id) on delete cascade,
  chunk_index integer not null,
  content text not null,
  -- sha256 of `content`, so re-indexing an unchanged document skips
  -- re-embedding (PLAN.md §4 "Cache results by input hash").
  content_hash text not null,
  page integer,
  embedding vector(768),
  created_at timestamptz not null default now(),
  unique (document_id, chunk_index)
);

create index if not exists document_chunks_document_id_idx on public.document_chunks (document_id);
create index if not exists document_chunks_user_id_idx on public.document_chunks (user_id);

create table if not exists public.ai_usage_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  feature text not null,
  provider text not null,
  input_tokens integer not null default 0,
  output_tokens integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists ai_usage_events_user_created_idx on public.ai_usage_events (user_id, created_at);

alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.memory_items enable row level security;
alter table public.memory_links enable row level security;
alter table public.assistant_actions enable row level security;
alter table public.document_chunks enable row level security;
alter table public.ai_usage_events enable row level security;

create policy "conversations_all_own" on public.conversations for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "messages_all_own" on public.messages for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "memory_items_all_own" on public.memory_items for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "memory_links_all_own" on public.memory_links for all
  using (
    exists (
      select 1 from public.memory_items mi
      where mi.id = memory_links.memory_item_id and mi.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.memory_items mi
      where mi.id = memory_links.memory_item_id and mi.user_id = auth.uid()
    )
  );

create policy "assistant_actions_all_own" on public.assistant_actions for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "document_chunks_all_own" on public.document_chunks for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "ai_usage_events_all_own" on public.ai_usage_events for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create trigger conversations_set_updated_at before update on public.conversations
  for each row execute function public.set_updated_at();
create trigger memory_items_set_updated_at before update on public.memory_items
  for each row execute function public.set_updated_at();
create trigger assistant_actions_set_updated_at before update on public.assistant_actions
  for each row execute function public.set_updated_at();

-- `security invoker` (the default) so RLS still applies via the caller's
-- auth.uid() — the p_user_id argument is a belt-and-suspenders explicit
-- filter, not a substitute for RLS.
create or replace function public.match_memory_items(
  p_user_id uuid,
  p_query_embedding vector(768),
  p_match_count int default 5
)
returns table (
  id uuid,
  text text,
  kind text,
  confidence numeric,
  similarity float
)
language sql
stable
set search_path = public
as $$
  select mi.id, mi.text, mi.kind, mi.confidence,
         1 - (mi.embedding <=> p_query_embedding) as similarity
  from public.memory_items mi
  where mi.user_id = p_user_id
    and mi.status in ('confirmed', 'pending')
    and mi.embedding is not null
  order by mi.embedding <=> p_query_embedding
  limit p_match_count;
$$;

create or replace function public.match_document_chunks(
  p_user_id uuid,
  p_query_embedding vector(768),
  p_match_count int default 5
)
returns table (
  id uuid,
  document_id uuid,
  content text,
  page int,
  chunk_index int,
  similarity float
)
language sql
stable
set search_path = public
as $$
  select dc.id, dc.document_id, dc.content, dc.page, dc.chunk_index,
         1 - (dc.embedding <=> p_query_embedding) as similarity
  from public.document_chunks dc
  where dc.user_id = p_user_id
    and dc.embedding is not null
  order by dc.embedding <=> p_query_embedding
  limit p_match_count;
$$;
