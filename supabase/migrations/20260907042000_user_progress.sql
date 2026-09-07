-- User progress synced from Lingora (one row per account)
create table if not exists public.user_progress (
  user_id uuid primary key references auth.users (id) on delete cascade,
  progress jsonb not null default '{"selectedLanguage":null,"languages":{}}'::jsonb,
  updated_at timestamptz not null default now()
);

create index if not exists user_progress_updated_at_idx
  on public.user_progress (updated_at desc);

alter table public.user_progress enable row level security;

create policy "Users can read own progress"
  on public.user_progress
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can insert own progress"
  on public.user_progress
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update own progress"
  on public.user_progress
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create or replace function public.handle_user_progress_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists user_progress_set_updated_at on public.user_progress;
create trigger user_progress_set_updated_at
  before update on public.user_progress
  for each row
  execute function public.handle_user_progress_updated_at();
