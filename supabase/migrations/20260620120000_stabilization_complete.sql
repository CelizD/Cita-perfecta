-- migrate: up
-- ============================================
-- MIGRACION DE ESTABILIZACION COMPLETA
-- Fecha: 2025-06-21
-- Descripcion: vistas publicas, RLS, consentimiento, indices y analytics
-- ============================================

alter table public.profiles
add column if not exists user_id uuid references auth.users(id) on delete cascade,
add column if not exists name text,
add column if not exists birthdate date,
add column if not exists age int,
add column if not exists city text,
add column if not exists bio text,
add column if not exists main_photo_url text,
add column if not exists deleted_at timestamptz,
add column if not exists is_paused boolean not null default false,
add column if not exists is_verified boolean not null default false,
add column if not exists is_premium boolean not null default false,
add column if not exists aura_name text,
add column if not exists shadowbanned boolean not null default false,
add column if not exists interests text[] not null default '{}',
add column if not exists communication_style text,
add column if not exists love_language text,
add column if not exists terms_accepted_at timestamptz,
add column if not exists terms_version varchar(10) default '1.0',
add column if not exists privacy_accepted_at timestamptz,
add column if not exists privacy_version varchar(10) default '1.0',
add column if not exists data_consent_given boolean not null default false,
add column if not exists data_consent_at timestamptz,
add column if not exists created_at timestamptz not null default now();

update public.profiles
set
  user_id = coalesce(user_id, id),
  name = coalesce(name, 'Perfil');

create or replace view public.public_profiles as
select
  id,
  user_id,
  name,
  case
    when birthdate is null then age
    else extract(year from age(birthdate))::integer
  end as age,
  city,
  main_photo_url,
  bio,
  is_verified,
  is_premium,
  aura_name,
  interests,
  communication_style,
  love_language,
  created_at
from public.profiles
where deleted_at is null
  and is_paused = false
  and shadowbanned = false;

grant select on public.public_profiles to authenticated;
grant select on public.public_profiles to anon;

alter table public.profiles enable row level security;
alter table public.answers enable row level security;
alter table public.connection_letters enable row level security;

drop policy if exists "profiles_select_authenticated" on public.profiles;
drop policy if exists "profiles_select_public" on public.profiles;
drop policy if exists "profiles_update_self" on public.profiles;
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

drop policy if exists "letters_select_participant" on public.connection_letters;
drop policy if exists "letters_insert_from_user" on public.connection_letters;
drop policy if exists "letters_update_participant" on public.connection_letters;

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

create index if not exists idx_swipes_from_to on public.swipes(from_user_id, to_user_id);
create index if not exists idx_matches_users on public.matches(user_a, user_b);
create index if not exists idx_messages_chat_created on public.messages(chat_id, created_at);
create index if not exists idx_profiles_public_feed on public.profiles(deleted_at, is_paused, shadowbanned, created_at);

create table if not exists public.user_logins (
  id bigint generated by default as identity primary key,
  user_id uuid references auth.users(id) on delete cascade,
  login_at timestamptz not null default now()
);

create index if not exists user_logins_user_id_login_at_idx
on public.user_logins(user_id, login_at);

alter table public.user_logins enable row level security;

drop policy if exists "user_logins_insert_self" on public.user_logins;
create policy "user_logins_insert_self"
on public.user_logins
for insert
to authenticated
with check (auth.uid() = user_id);

-- migrate: down
drop view if exists public.public_profiles;
drop table if exists public.user_logins;
