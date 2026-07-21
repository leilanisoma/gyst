-- Phase 11: schedule the six cron jobs via pg_cron + pg_net instead of
-- vercel.json. Each job calls the existing GET /api/cron/* route with the
-- same `Authorization: Bearer $CRON_SECRET` header those routes already
-- check — no route code changes.
--
-- REQUIRES a one-time manual step first (never committed — see
-- docs/DECISIONS/0005-pg-cron-scheduling.md): store the real CRON_SECRET in
-- Supabase Vault under the name 'cron_secret':
--
--   select vault.create_secret('<the real CRON_SECRET value>', 'cron_secret');
--
-- REQUIRES confirming the production domain below (currently
-- ishanigyst.vercel.app per docs/PHASES/phase-10.md — verify before running,
-- it changed more than once during initial setup).

-- Calendar: nightly (was never scheduled at all before this phase — only a
-- manual "sync now" button on Settings).
select cron.schedule(
  'sync-calendar-nightly',
  '0 9 * * *', -- ~1-2am Pacific
  $$
  select net.http_get(
    url := 'https://ishanigyst.vercel.app/api/cron/sync-calendar',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret' limit 1)
    ),
    timeout_milliseconds := 60000
  );
  $$
);

-- Gmail: hourly (was daily).
select cron.schedule(
  'sync-gmail-hourly',
  '0 * * * *',
  $$
  select net.http_get(
    url := 'https://ishanigyst.vercel.app/api/cron/sync-gmail',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret' limit 1)
    ),
    timeout_milliseconds := 60000
  );
  $$
);

-- Canvas: daily (unchanged cadence, same time slot as the old vercel.json entry).
select cron.schedule(
  'sync-canvas-daily',
  '0 12 * * *', -- ~5am Pacific
  $$
  select net.http_get(
    url := 'https://ishanigyst.vercel.app/api/cron/sync-canvas',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret' limit 1)
    ),
    timeout_milliseconds := 60000
  );
  $$
);

-- Internship/job discovery: every 3 hours (was daily).
select cron.schedule(
  'discover-jobs-every-3h',
  '0 */3 * * *',
  $$
  select net.http_get(
    url := 'https://ishanigyst.vercel.app/api/cron/discover-jobs',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret' limit 1)
    ),
    timeout_milliseconds := 60000
  );
  $$
);

-- Weekly recruiting digest: unchanged cadence (Monday).
select cron.schedule(
  'weekly-digest-monday',
  '0 14 * * 1', -- ~7am Pacific
  $$
  select net.http_get(
    url := 'https://ishanigyst.vercel.app/api/cron/weekly-digest',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret' limit 1)
    ),
    timeout_milliseconds := 60000
  );
  $$
);

-- Gmail item purge (privacy retention cleanup): unchanged cadence.
select cron.schedule(
  'purge-gmail-items-nightly',
  '30 3 * * *',
  $$
  select net.http_get(
    url := 'https://ishanigyst.vercel.app/api/cron/purge-gmail-items',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret' limit 1)
    ),
    timeout_milliseconds := 60000
  );
  $$
);

-- New: deadline reminders (recruiting next-actions / school assessments /
-- any task due_date, all via the universal `tasks` table) — daily, once
-- each morning ahead of the day.
select cron.schedule(
  'deadline-reminders-daily',
  '0 13 * * *', -- ~6am Pacific
  $$
  select net.http_get(
    url := 'https://ishanigyst.vercel.app/api/cron/deadline-reminders',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret' limit 1)
    ),
    timeout_milliseconds := 60000
  );
  $$
);
