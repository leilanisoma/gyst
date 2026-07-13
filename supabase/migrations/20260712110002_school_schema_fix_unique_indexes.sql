-- Fixes 20260712110001: partial unique indexes aren't valid ON CONFLICT
-- targets for a plain `upsert({ onConflict: "user_id,canvas_course_id" })`
-- call (Postgres requires the arbiter index's predicate, if any, to be
-- restated in the conflict clause itself, which supabase-js doesn't do).
-- A plain unique constraint works the same way for this data — Postgres
-- never treats two NULLs as conflicting — without needing a predicate.
-- Recovery: reapply the dropped partial indexes from 20260712110001.

drop index if exists public.courses_user_canvas_id_idx;
alter table public.courses add constraint courses_user_canvas_id_key unique (user_id, canvas_course_id);

drop index if exists public.assignments_user_canvas_id_idx;
alter table public.assignments add constraint assignments_user_canvas_id_key unique (user_id, canvas_assignment_id);
