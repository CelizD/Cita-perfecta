-- migrate: up
-- Cita Perfecta - politicas RLS mas restrictivas

alter table public.profiles
add column if not exists user_id uuid references auth.users(id) on delete cascade,
add column if not exists deleted_at timestamptz,
add column if not exists is_paused boolean not null default false,
add column if not exists shadowbanned boolean not null default false;

alter table public.profiles enable row level security;
alter table public.answers enable row level security;
alter table public.connection_letters enable row level security;

drop policy if exists "profiles_select_authenticated" on public.profiles;
drop policy if exists "profiles_select_public" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;
drop policy if exists "profiles_update_own_user_id" on public.profiles;
drop policy if exists "profiles_delete_self" on public.profiles;

create policy "profiles_select_authenticated"
on public.profiles
for select
to authenticated
using (
  auth.uid() = coalesce(user_id, id)
  or (
    deleted_at is null
    and is_paused = false
    and shadowbanned = false
    and not exists (
      select 1
      from public.blocks
      where (blocks.blocker_id = auth.uid() and blocks.blocked_user_id = coalesce(profiles.user_id, profiles.id))
         or (blocks.blocker_id = coalesce(profiles.user_id, profiles.id) and blocks.blocked_user_id = auth.uid())
    )
  )
);

create policy "profiles_update_self"
on public.profiles
for update
to authenticated
using (auth.uid() = coalesce(user_id, id))
with check (auth.uid() = coalesce(user_id, id));

create policy "profiles_delete_self"
on public.profiles
for delete
to authenticated
using (auth.uid() = coalesce(user_id, id));

drop policy if exists "answers_manage_own" on public.answers;
drop policy if exists "answers_select_self" on public.answers;
drop policy if exists "answers_insert_self" on public.answers;
drop policy if exists "answers_update_self" on public.answers;

create policy "answers_select_self"
on public.answers
for select
to authenticated
using (auth.uid() = user_id);

create policy "answers_insert_self"
on public.answers
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "answers_update_self"
on public.answers
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "letters_insert_own" on public.connection_letters;
drop policy if exists "letters_select_related" on public.connection_letters;
drop policy if exists "letters_update_receiver" on public.connection_letters;
drop policy if exists "letters_select_participant" on public.connection_letters;
drop policy if exists "letters_insert_from_user" on public.connection_letters;

create policy "letters_select_participant"
on public.connection_letters
for select
to authenticated
using (auth.uid() = from_user_id or auth.uid() = to_user_id);

create policy "letters_insert_from_user"
on public.connection_letters
for insert
to authenticated
with check (auth.uid() = from_user_id);

create policy "letters_update_participant"
on public.connection_letters
for update
to authenticated
using (auth.uid() = from_user_id or auth.uid() = to_user_id)
with check (auth.uid() = from_user_id or auth.uid() = to_user_id);

-- migrate: down
drop policy if exists "profiles_select_authenticated" on public.profiles;
drop policy if exists "profiles_update_self" on public.profiles;
drop policy if exists "profiles_delete_self" on public.profiles;
drop policy if exists "answers_select_self" on public.answers;
drop policy if exists "answers_insert_self" on public.answers;
drop policy if exists "answers_update_self" on public.answers;
drop policy if exists "letters_select_participant" on public.connection_letters;
drop policy if exists "letters_insert_from_user" on public.connection_letters;
drop policy if exists "letters_update_participant" on public.connection_letters;
