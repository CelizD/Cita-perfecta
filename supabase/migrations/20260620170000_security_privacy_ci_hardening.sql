-- migrate: up
-- Cita Perfecta - hardening de seguridad, privacidad y reportes reales.

create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select coalesce(
    (auth.jwt() -> 'app_metadata' ->> 'app_role') = 'admin'
    or (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
    or (auth.jwt() -> 'app_metadata' ->> 'is_admin') = 'true',
    false
  );
$$;

grant execute on function public.is_admin() to authenticated;

alter table public.profiles
add column if not exists user_id uuid references auth.users(id) on delete cascade,
add column if not exists name text,
add column if not exists full_name text,
add column if not exists birthdate date,
add column if not exists birth_date date,
add column if not exists age int,
add column if not exists city text,
add column if not exists bio text,
add column if not exists main_photo_url text,
add column if not exists main_photo_path text,
add column if not exists is_verified boolean not null default false,
add column if not exists is_premium boolean not null default false,
add column if not exists premium boolean not null default false,
add column if not exists aura_name text,
add column if not exists interests text[] not null default '{}',
add column if not exists communication_style text,
add column if not exists love_language text,
add column if not exists created_at timestamptz not null default now(),
add column if not exists deleted_at timestamptz,
add column if not exists is_paused boolean not null default false,
add column if not exists shadowbanned boolean not null default false;

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_authenticated" on public.profiles;
drop policy if exists "profiles_select_public" on public.profiles;
drop policy if exists "profiles_select_self_or_admin" on public.profiles;
drop policy if exists "profiles_insert_self" on public.profiles;
drop policy if exists "profiles_update_self" on public.profiles;
drop policy if exists "profiles_delete_self" on public.profiles;

create policy "profiles_select_self_or_admin"
on public.profiles
for select
to authenticated
using (auth.uid() = coalesce(user_id, id) or public.is_admin());

create policy "profiles_insert_self"
on public.profiles
for insert
to authenticated
with check (auth.uid() = coalesce(user_id, id));

create policy "profiles_update_self"
on public.profiles
for update
to authenticated
using (auth.uid() = coalesce(user_id, id) or public.is_admin())
with check (auth.uid() = coalesce(user_id, id) or public.is_admin());

create policy "profiles_delete_self"
on public.profiles
for delete
to authenticated
using (auth.uid() = coalesce(user_id, id) or public.is_admin());

create or replace view public.public_profiles as
select
  id,
  coalesce(user_id, id) as user_id,
  coalesce(name, full_name, 'Perfil') as name,
  case
    when birthdate is not null then extract(year from age(birthdate))::integer
    when birth_date is not null then extract(year from age(birth_date))::integer
    else age
  end as age,
  city,
  main_photo_url,
  main_photo_path,
  bio,
  coalesce(is_verified, false) as is_verified,
  coalesce(is_premium, premium, false) as is_premium,
  aura_name,
  interests,
  communication_style,
  love_language,
  created_at
from public.profiles
where deleted_at is null
  and is_paused = false
  and shadowbanned = false
  and (
    auth.uid() is null
    or coalesce(user_id, id) = auth.uid()
    or not exists (
      select 1
      from public.blocks
      where (blocks.blocker_id = auth.uid() and blocks.blocked_user_id = coalesce(profiles.user_id, profiles.id))
         or (blocks.blocker_id = coalesce(profiles.user_id, profiles.id) and blocks.blocked_user_id = auth.uid())
    )
  );

revoke all on public.public_profiles from anon;
grant select on public.public_profiles to authenticated;

update storage.buckets
set public = false
where id = 'profile-photos';

drop policy if exists "profile_photos_public_read" on storage.objects;
drop policy if exists "profile_photos_authenticated_read" on storage.objects;

create policy "profile_photos_authenticated_read"
on storage.objects
for select
to authenticated
using (bucket_id = 'profile-photos');

create table if not exists public.vulnerability_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid references public.profiles(id) on delete set null,
  description text not null,
  steps text not null,
  status text not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.vulnerability_reports enable row level security;

drop policy if exists "vulnerability_reports_insert_own" on public.vulnerability_reports;
drop policy if exists "vulnerability_reports_select_own_or_admin" on public.vulnerability_reports;
drop policy if exists "vulnerability_reports_update_admin" on public.vulnerability_reports;

create policy "vulnerability_reports_insert_own"
on public.vulnerability_reports
for insert
to authenticated
with check (reporter_id is null or reporter_id = auth.uid());

create policy "vulnerability_reports_select_own_or_admin"
on public.vulnerability_reports
for select
to authenticated
using (reporter_id = auth.uid() or public.is_admin());

create policy "vulnerability_reports_update_admin"
on public.vulnerability_reports
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create index if not exists vulnerability_reports_reporter_created_idx
on public.vulnerability_reports(reporter_id, created_at desc);

-- migrate: down
drop policy if exists "vulnerability_reports_insert_own" on public.vulnerability_reports;
drop policy if exists "vulnerability_reports_select_own_or_admin" on public.vulnerability_reports;
drop policy if exists "vulnerability_reports_update_admin" on public.vulnerability_reports;
drop table if exists public.vulnerability_reports;
drop policy if exists "profile_photos_authenticated_read" on storage.objects;
drop policy if exists "profiles_select_self_or_admin" on public.profiles;
drop policy if exists "profiles_insert_self" on public.profiles;
drop policy if exists "profiles_update_self" on public.profiles;
drop policy if exists "profiles_delete_self" on public.profiles;
drop function if exists public.is_admin();
