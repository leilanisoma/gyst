-- Phase 6: Canvas and school planning schema. Recovery: `drop table if
-- exists public.milestone_suggestions, public.work_estimates,
-- public.syllabus_items, public.assessments, public.assignments,
-- public.courses cascade; alter table public.events drop column if exists
-- course_id; alter table public.documents drop column if exists course_id;
-- alter table public.tasks drop column if exists source_assignment_id,
-- drop column if exists source_assessment_id;`

create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  canvas_course_id text,
  term text,
  title text not null,
  course_code text,
  instructor text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists courses_user_canvas_id_idx
  on public.courses (user_id, canvas_course_id) where canvas_course_id is not null;

create table if not exists public.assignments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  course_id uuid not null references public.courses (id) on delete cascade,
  canvas_assignment_id text,
  title text not null,
  due_at timestamptz,
  points_possible numeric,
  submission_types text[] not null default '{}',
  submitted boolean not null default false,
  submitted_at timestamptz,
  html_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists assignments_user_canvas_id_idx
  on public.assignments (user_id, canvas_assignment_id) where canvas_assignment_id is not null;
create index if not exists assignments_course_id_idx on public.assignments (course_id);
create index if not exists assignments_due_at_idx on public.assignments (user_id, due_at);

create table if not exists public.assessments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  course_id uuid not null references public.courses (id) on delete cascade,
  assignment_id uuid references public.assignments (id) on delete set null,
  kind text not null default 'other'
    check (kind in ('quiz', 'midterm', 'final', 'presentation', 'project', 'other')),
  title text not null,
  scheduled_at timestamptz,
  location text,
  coverage text,
  preparation_status text not null default 'not_started'
    check (preparation_status in ('not_started', 'in_progress', 'ready')),
  source text not null default 'manual' check (source in ('manual', 'canvas', 'syllabus')),
  confidence numeric check (confidence is null or (confidence >= 0 and confidence <= 1)),
  confirmed boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists assessments_course_id_idx on public.assessments (course_id);
create index if not exists assessments_scheduled_at_idx on public.assessments (user_id, scheduled_at);

create table if not exists public.syllabus_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  course_id uuid not null references public.courses (id) on delete cascade,
  document_id uuid references public.documents (id) on delete set null,
  kind text not null default 'other' check (kind in ('policy', 'major_date', 'other')),
  title text not null,
  description text,
  date timestamptz,
  source_page integer,
  confidence numeric check (confidence is null or (confidence >= 0 and confidence <= 1)),
  confirmed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists syllabus_items_course_id_idx on public.syllabus_items (course_id);

create table if not exists public.work_estimates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  task_id uuid not null references public.tasks (id) on delete cascade,
  predicted_minutes integer not null,
  actual_minutes integer,
  estimator_version text not null default 'v1',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists work_estimates_task_id_idx on public.work_estimates (task_id);

create table if not exists public.milestone_suggestions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  assignment_id uuid references public.assignments (id) on delete cascade,
  assessment_id uuid references public.assessments (id) on delete cascade,
  title text not null,
  due_date timestamptz not null,
  estimated_minutes integer,
  status text not null default 'proposed' check (status in ('proposed', 'accepted', 'dismissed')),
  created_task_id uuid references public.tasks (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint milestone_suggestions_one_source check (
    (assignment_id is not null and assessment_id is null)
    or (assignment_id is null and assessment_id is not null)
  )
);

create index if not exists milestone_suggestions_status_idx on public.milestone_suggestions (user_id, status);

-- Extend existing generic tables rather than duplicating them (Phase 3's
-- `events` already models "title/start/end/location/source" exactly like a
-- Canvas calendar entry; `documents` already models "kind/storage_path" for
-- an uploaded file). A `course_events`/separate-syllabus-file table per
-- PLAN.md's original data model would just re-implement both.
alter table public.events add column if not exists course_id uuid references public.courses (id) on delete set null;
alter table public.events drop constraint if exists events_source_check;
alter table public.events add constraint events_source_check check (source in ('google', 'manual', 'canvas'));

alter table public.documents add column if not exists course_id uuid references public.courses (id) on delete set null;
alter table public.documents drop constraint if exists documents_kind_check;
alter table public.documents add constraint documents_kind_check check (kind in (
  'resume', 'transcript', 'cover_letter', 'writing_sample', 'job_description', 'syllabus', 'other'
));

alter table public.integrations drop constraint if exists integrations_provider_check;
alter table public.integrations add constraint integrations_provider_check check (provider in ('google', 'canvas'));

alter table public.sync_runs drop constraint if exists sync_runs_provider_check;
alter table public.sync_runs add constraint sync_runs_provider_check check (provider in ('google', 'canvas'));

alter table public.tasks add column if not exists source_assignment_id uuid references public.assignments (id) on delete set null;
alter table public.tasks add column if not exists source_assessment_id uuid references public.assessments (id) on delete set null;

create index if not exists tasks_source_assignment_id_idx on public.tasks (source_assignment_id) where source_assignment_id is not null;

alter table public.courses enable row level security;
alter table public.assignments enable row level security;
alter table public.assessments enable row level security;
alter table public.syllabus_items enable row level security;
alter table public.work_estimates enable row level security;
alter table public.milestone_suggestions enable row level security;

create policy "courses_all_own" on public.courses for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "assignments_all_own" on public.assignments for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "assessments_all_own" on public.assessments for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "syllabus_items_all_own" on public.syllabus_items for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "work_estimates_all_own" on public.work_estimates for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "milestone_suggestions_all_own" on public.milestone_suggestions for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create trigger courses_set_updated_at before update on public.courses
  for each row execute function public.set_updated_at();
create trigger assignments_set_updated_at before update on public.assignments
  for each row execute function public.set_updated_at();
create trigger assessments_set_updated_at before update on public.assessments
  for each row execute function public.set_updated_at();
create trigger syllabus_items_set_updated_at before update on public.syllabus_items
  for each row execute function public.set_updated_at();
create trigger work_estimates_set_updated_at before update on public.work_estimates
  for each row execute function public.set_updated_at();
create trigger milestone_suggestions_set_updated_at before update on public.milestone_suggestions
  for each row execute function public.set_updated_at();
