-- Cycle tracking now records fertility-monitor hormone readings (LH, E3G,
-- PdG, FSH — tested every other day) and a simple on/off period flag,
-- instead of just flow/symptoms/note. Also drops resting_heart_rate from
-- health_daily_summaries (no longer tracked).
-- Recovery:
--   alter table public.cycle_observations
--     drop column if exists on_period,
--     drop column if exists lh,
--     drop column if exists e3g,
--     drop column if exists pdg,
--     drop column if exists fsh;
--   alter table public.health_daily_summaries
--     add column resting_heart_rate integer check (resting_heart_rate is null or resting_heart_rate >= 0);

alter table public.cycle_observations
  add column if not exists on_period boolean,
  add column if not exists lh numeric check (lh is null or lh >= 0),
  add column if not exists e3g numeric check (e3g is null or e3g >= 0),
  add column if not exists pdg numeric check (pdg is null or pdg >= 0),
  add column if not exists fsh numeric check (fsh is null or fsh >= 0);

alter table public.health_daily_summaries
  drop column if exists resting_heart_rate;
