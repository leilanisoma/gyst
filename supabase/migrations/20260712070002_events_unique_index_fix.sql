-- Fix: PostgREST upsert (used by supabase-js .upsert()) infers a conflict
-- target from an exact, non-partial unique index on the given columns.
-- The original partial index (`where source_id is not null`) can't be used
-- that way. A plain unique index works fine here anyway: Postgres never
-- treats two NULLs as equal, so multiple manual `events` rows with a null
-- source_id remain unaffected.
-- Recovery: recreate the partial index from 20260712070001 if reverting.

drop index if exists public.events_user_source_idx;

create unique index if not exists events_user_source_idx
  on public.events (user_id, source, source_id);
