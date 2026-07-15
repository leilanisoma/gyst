-- Phase 7 (task 7.1): make room for a Gmail OAuth connection that is a
-- distinct Google account from the one already connected for Calendar
-- (Phase 3). `integrations`/`oauth_tokens` key one row per (user_id,
-- provider); Gmail gets its own provider value ('gmail') rather than
-- reusing 'google', so it never collides with the existing Calendar row
-- and can hold its own tokens/scopes/account_email for a different
-- account. Recovery: re-run the two `drop constraint`/`add constraint`
-- pairs below with 'google', 'canvas' (dropping 'gmail').

alter table public.integrations drop constraint if exists integrations_provider_check;
alter table public.integrations add constraint integrations_provider_check
  check (provider in ('google', 'canvas', 'gmail'));

alter table public.oauth_tokens drop constraint if exists oauth_tokens_provider_check;
alter table public.oauth_tokens add constraint oauth_tokens_provider_check
  check (provider in ('google', 'gmail'));

alter table public.sync_runs drop constraint if exists sync_runs_provider_check;
alter table public.sync_runs add constraint sync_runs_provider_check
  check (provider in ('google', 'canvas', 'gmail'));
