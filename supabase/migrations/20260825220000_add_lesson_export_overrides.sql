-- Repair log for accessibility overrides.
--
-- A blocking rubric failure normally stops export. A teacher may override it,
-- but only on the record: this table is the "so it can be repaired later" half
-- of that bargain. Every row is a known accessibility defect that shipped to an
-- LMS, with enough detail to find it and fix it.

create table public.lesson_export_overrides (
  id uuid primary key default gen_random_uuid(),
  -- Nullable: a lesson can be exported before it is persisted. When present it
  -- is the fastest route back to the content that needs repairing.
  lesson_id uuid references public.generated_lessons(id) on delete set null,
  user_id uuid not null references auth.users(id) on delete cascade,
  rubric_version text not null,
  -- Where it went, so the shipped artifact can be located and replaced.
  export_target text not null check (export_target in ('canvas', 'html_download', 'zip_download')),
  lesson_title text,
  -- The repair list: [{ name, label, details }] captured at override time.
  -- Re-running the rubric later cannot reconstruct this, because the lesson may
  -- have been edited since.
  overridden_checks jsonb not null,
  -- Why it shipped anyway. Length is enforced here as well as in the app so a
  -- direct API call cannot write a meaningless reason.
  reason text not null check (length(btrim(reason)) >= 20),
  created_at timestamptz not null default now(),

  -- Resolution workflow. An unresolved row is an outstanding accessibility
  -- defect in a district's LMS.
  resolved_at timestamptz,
  resolved_by uuid references auth.users(id) on delete set null,
  resolution_note text,
  constraint resolution_is_complete check (
    (resolved_at is null and resolved_by is null and resolution_note is null)
    or (resolved_at is not null and resolved_by is not null)
  )
);

create index lesson_export_overrides_lesson_id_idx
  on public.lesson_export_overrides(lesson_id);
create index lesson_export_overrides_user_id_idx
  on public.lesson_export_overrides(user_id);
-- The query that matters: what is still broken out there, oldest first.
create index lesson_export_overrides_unresolved_idx
  on public.lesson_export_overrides(created_at)
  where resolved_at is null;

comment on table public.lesson_export_overrides is
  'Accessibility failures a teacher chose to export anyway. An unresolved row is a known WCAG defect live in an LMS; resolve it only once the exported page has been replaced.';

alter table public.lesson_export_overrides enable row level security;

create policy "Users can view own export overrides"
  on public.lesson_export_overrides
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can insert own export overrides"
  on public.lesson_export_overrides
  for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Teachers may close out their own overrides once they have repaired the export.
create policy "Users can resolve own export overrides"
  on public.lesson_export_overrides
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Service role can update export overrides"
  on public.lesson_export_overrides
  for update
  using (auth.role() = 'service_role'::text);

-- RLS cannot restrict *which columns* an update touches, so without this a
-- teacher could edit the reason or the repair list after the fact and the log
-- would no longer describe what actually shipped. Only the resolution fields
-- are mutable, and only by a non-service-role caller.
create or replace function public.lesson_export_overrides_immutable()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.role() = 'service_role' then
    return new;
  end if;
  if new.lesson_id is distinct from old.lesson_id
     or new.user_id is distinct from old.user_id
     or new.rubric_version is distinct from old.rubric_version
     or new.export_target is distinct from old.export_target
     or new.lesson_title is distinct from old.lesson_title
     or new.overridden_checks is distinct from old.overridden_checks
     or new.reason is distinct from old.reason
     or new.created_at is distinct from old.created_at then
    raise exception
      'An export override is an audit record: only resolved_at, resolved_by and resolution_note may be changed.';
  end if;
  return new;
end;
$$;

create trigger lesson_export_overrides_immutable_trg
  before update on public.lesson_export_overrides
  for each row execute function public.lesson_export_overrides_immutable();

-- Deliberately no delete policy for authenticated users: the point of the log is
-- that a shipped defect cannot be quietly erased.
create policy "Service role can delete export overrides"
  on public.lesson_export_overrides
  for delete
  using (auth.role() = 'service_role'::text);
