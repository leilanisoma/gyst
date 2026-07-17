-- Bump default target graduation year 2027 -> 2028 (PLAN.md §9).
-- Recovery: `alter table public.preferences alter column recruiting_preferences set default '{"target_grad_year": 2027}'::jsonb;`
-- and `update public.preferences set recruiting_preferences = jsonb_set(recruiting_preferences, '{target_grad_year}', '2027') where recruiting_preferences->>'target_grad_year' = '2028';`

alter table public.preferences
  alter column recruiting_preferences set default '{"target_grad_year": 2028}'::jsonb;

update public.preferences
set recruiting_preferences = jsonb_set(recruiting_preferences, '{target_grad_year}', '2028')
where recruiting_preferences->>'target_grad_year' = '2027';
