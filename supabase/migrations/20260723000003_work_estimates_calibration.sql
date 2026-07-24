-- Lets Canvas sync calibrate future estimates against real logged history:
-- denormalizing course_id/category onto work_estimates so calibration can
-- query "prior actual-vs-predicted ratio for this course + kind of work"
-- without a three-table join through tasks/assignments on every sync.
-- Recovery: `alter table public.work_estimates drop column if exists course_id, drop column if exists category;`

alter table public.work_estimates
  add column if not exists course_id uuid references public.courses (id) on delete set null,
  add column if not exists category text;

create index if not exists work_estimates_course_category_idx
  on public.work_estimates (course_id, category);
