-- Phase 9B descoped: no Apple Developer Program enrollment, so the native
-- SwiftUI/HealthKit companion is dropped in favor of manual entry in the
-- webapp (docs/PHASES/phase-9.md, decided 2026-07-16). The device-pairing/
-- token-exchange tables existed only to authenticate that native client and
-- have no other consumer.
-- Recovery: re-run the `create table`/index/RLS/policy statements for
-- device_pairing_codes and device_tokens from
-- 20260717000001_health_companion_schema.sql to restore them, and
-- `alter table public.health_daily_summaries alter column source set default 'healthkit';`
-- to revert the default.

drop table if exists public.device_pairing_codes cascade;
drop table if exists public.device_tokens cascade;

alter table public.health_daily_summaries
  alter column source set default 'manual_entry';
