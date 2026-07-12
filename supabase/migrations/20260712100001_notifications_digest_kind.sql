-- Phase 5.8: weekly recruiting digest needs a notification kind of its own.
-- Recovery: `alter table public.notifications drop constraint if exists
-- notifications_kind_check; alter table public.notifications add constraint
-- notifications_kind_check check (kind in ('info', 'sync_error', 'deadline',
-- 'block_reminder'));`

alter table public.notifications drop constraint if exists notifications_kind_check;
alter table public.notifications add constraint notifications_kind_check
  check (kind in ('info', 'sync_error', 'deadline', 'block_reminder', 'digest'));
