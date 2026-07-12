-- Phase 4: recruiting MVP schema — companies, opportunities, applications,
-- application_events, contacts, interactions, documents, drafts, and a
-- private Storage bucket for uploaded documents.
-- Recovery: `drop table if exists public.drafts, public.documents,
-- public.interactions, public.contacts, public.application_events,
-- public.applications, public.job_scores, public.opportunities,
-- public.companies cascade;` and remove the "documents" storage bucket.

create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  domain text,
  size_category text check (size_category in ('startup', 'smb', 'midsize', 'large', 'enterprise')),
  established boolean not null default false,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.opportunities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  company_id uuid not null references public.companies (id) on delete cascade,
  title text not null,
  location text,
  description text,
  url text,
  role_family text not null default 'other' check (role_family in (
    'product_management', 'product_ops_business_ops', 'strategy_consulting',
    'growth_business_development', 'data_analytics_insights',
    'ai_adjacent_non_swe', 'venture_startup_ecosystem', 'other'
  )),
  is_swe boolean not null default false,
  is_finance boolean not null default false,
  eligible_grad_years integer[] not null default '{}',
  deadline timestamptz,
  posted_at timestamptz,
  source text not null default 'manual',
  fingerprint text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, fingerprint)
);

create table if not exists public.job_scores (
  id uuid primary key default gen_random_uuid(),
  opportunity_id uuid not null references public.opportunities (id) on delete cascade,
  role_family_score integer not null default 0,
  skills_experience_score integer not null default 0,
  eligibility_score integer not null default 0,
  interest_industry_score integer not null default 0,
  established_company_score integer not null default 0,
  deadline_urgency_score integer not null default 0,
  user_feedback_score integer not null default 0,
  total_score integer not null default 0,
  excluded boolean not null default false,
  exclusion_reason text,
  explanation text not null default '',
  score_version integer not null default 1,
  computed_at timestamptz not null default now(),
  unique (opportunity_id)
);

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  kind text not null check (kind in (
    'resume', 'transcript', 'cover_letter', 'writing_sample', 'job_description', 'other'
  )),
  title text not null,
  storage_path text not null,
  file_name text not null,
  mime_type text,
  size_bytes integer,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  opportunity_id uuid not null references public.opportunities (id) on delete cascade,
  stage text not null default 'saved' check (stage in (
    'discovered', 'saved', 'preparing', 'ready', 'applied', 'assessment',
    'recruiter_screen', 'interview', 'final_round', 'offer', 'rejected',
    'withdrawn', 'archived'
  )),
  resume_document_id uuid references public.documents (id) on delete set null,
  submitted_date date,
  notes text,
  prep_notes text,
  next_action text,
  next_action_date timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, opportunity_id)
);

create table if not exists public.application_events (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications (id) on delete cascade,
  from_stage text,
  to_stage text not null,
  note text,
  occurred_at timestamptz not null default now()
);

create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  company_id uuid references public.companies (id) on delete set null,
  name text not null,
  role text,
  relationship text check (relationship in (
    'alum', 'referral', 'recruiter', 'mentor', 'colleague', 'friend', 'other'
  )),
  email text,
  linkedin_url text,
  last_contacted_at timestamptz,
  next_contact_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.interactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  contact_id uuid not null references public.contacts (id) on delete cascade,
  application_id uuid references public.applications (id) on delete set null,
  kind text not null default 'other' check (kind in (
    'meeting', 'call', 'email', 'message', 'coffee_chat', 'event', 'other'
  )),
  summary text not null,
  occurred_at timestamptz not null default now(),
  follow_up_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.drafts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  application_id uuid not null references public.applications (id) on delete cascade,
  kind text not null check (kind in ('cover_letter', 'recruiter_message', 'application_response')),
  resume_document_id uuid references public.documents (id) on delete set null,
  content text not null default '',
  evidence_document_ids uuid[] not null default '{}',
  unsupported_claims text[] not null default '{}',
  status text not null default 'draft' check (status in ('draft', 'approved', 'exported')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists companies_user_id_idx on public.companies (user_id);
create index if not exists opportunities_user_id_idx on public.opportunities (user_id);
create index if not exists opportunities_company_id_idx on public.opportunities (company_id);
create index if not exists job_scores_opportunity_id_idx on public.job_scores (opportunity_id);
create index if not exists documents_user_id_idx on public.documents (user_id);
create index if not exists applications_user_id_idx on public.applications (user_id);
create index if not exists applications_stage_idx on public.applications (user_id, stage);
create index if not exists applications_next_action_date_idx on public.applications (user_id, next_action_date);
create index if not exists application_events_application_id_idx on public.application_events (application_id);
create index if not exists contacts_user_id_idx on public.contacts (user_id);
create index if not exists interactions_contact_id_idx on public.interactions (contact_id);
create index if not exists interactions_follow_up_at_idx on public.interactions (user_id, follow_up_at);
create index if not exists drafts_application_id_idx on public.drafts (application_id);

alter table public.companies enable row level security;
alter table public.opportunities enable row level security;
alter table public.job_scores enable row level security;
alter table public.documents enable row level security;
alter table public.applications enable row level security;
alter table public.application_events enable row level security;
alter table public.contacts enable row level security;
alter table public.interactions enable row level security;
alter table public.drafts enable row level security;

create policy "companies_all_own" on public.companies for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "opportunities_all_own" on public.opportunities for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- job_scores has no user_id column; ownership is derived through opportunities.
create policy "job_scores_all_own" on public.job_scores for all
  using (exists (
    select 1 from public.opportunities o
    where o.id = job_scores.opportunity_id and o.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.opportunities o
    where o.id = job_scores.opportunity_id and o.user_id = auth.uid()
  ));

create policy "documents_all_own" on public.documents for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "applications_all_own" on public.applications for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- application_events has no user_id column; ownership is derived through applications.
create policy "application_events_all_own" on public.application_events for all
  using (exists (
    select 1 from public.applications a
    where a.id = application_events.application_id and a.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.applications a
    where a.id = application_events.application_id and a.user_id = auth.uid()
  ));

create policy "contacts_all_own" on public.contacts for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "interactions_all_own" on public.interactions for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "drafts_all_own" on public.drafts for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create trigger companies_set_updated_at before update on public.companies
  for each row execute function public.set_updated_at();
create trigger opportunities_set_updated_at before update on public.opportunities
  for each row execute function public.set_updated_at();
create trigger documents_set_updated_at before update on public.documents
  for each row execute function public.set_updated_at();
create trigger applications_set_updated_at before update on public.applications
  for each row execute function public.set_updated_at();
create trigger contacts_set_updated_at before update on public.contacts
  for each row execute function public.set_updated_at();
create trigger interactions_set_updated_at before update on public.interactions
  for each row execute function public.set_updated_at();
create trigger drafts_set_updated_at before update on public.drafts
  for each row execute function public.set_updated_at();

-- Private Storage bucket for resumes, transcripts, writing samples, etc.
-- Objects are keyed "<user_id>/<uuid>-<filename>"; RLS restricts access to
-- the owning folder, matching every other user-owned table in this schema.
insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do nothing;

create policy "documents_bucket_select_own" on storage.objects for select
  using (bucket_id = 'documents' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "documents_bucket_insert_own" on storage.objects for insert
  with check (bucket_id = 'documents' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "documents_bucket_update_own" on storage.objects for update
  using (bucket_id = 'documents' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'documents' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "documents_bucket_delete_own" on storage.objects for delete
  using (bucket_id = 'documents' and (storage.foldername(name))[1] = auth.uid()::text);
