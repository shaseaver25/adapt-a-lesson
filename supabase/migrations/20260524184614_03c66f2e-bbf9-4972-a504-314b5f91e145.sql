create table public.lesson_validation_results (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.generated_lessons(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  rubric_version text not null,
  passed boolean not null,
  hard_check_results jsonb not null,
  soft_check_results jsonb,
  regen_attempts integer not null default 0,
  validated_at timestamptz not null default now()
);

create index lesson_validation_results_lesson_id_idx on public.lesson_validation_results(lesson_id);
create index lesson_validation_results_user_id_idx on public.lesson_validation_results(user_id);

alter table public.lesson_validation_results enable row level security;

create policy "Users can view own validation results"
  on public.lesson_validation_results
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can insert own validation results"
  on public.lesson_validation_results
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Service role can update validation results"
  on public.lesson_validation_results
  for update
  using (auth.role() = 'service_role'::text);

create policy "Service role can delete validation results"
  on public.lesson_validation_results
  for delete
  using (auth.role() = 'service_role'::text);