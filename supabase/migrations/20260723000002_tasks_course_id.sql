-- Lets a task be tagged with a specific class, so School's "+ Add task"
-- can offer a course picker (pulled from the user's synced courses) instead
-- of just a bare title. Nullable/on-delete-set-null since most tasks
-- (general/recruiting/wellness) have no course at all.
-- Recovery: `alter table public.tasks drop column if exists course_id;`

alter table public.tasks
  add column if not exists course_id uuid references public.courses (id) on delete set null;

create index if not exists tasks_course_id_idx on public.tasks (course_id);
