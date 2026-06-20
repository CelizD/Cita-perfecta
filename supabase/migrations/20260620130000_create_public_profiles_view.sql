-- migrate: up
-- Cita Perfecta - vista publica segura de perfiles

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
add column if not exists created_at timestamptz not null default now();

update public.profiles
set
  user_id = coalesce(user_id, id),
  name = coalesce(name, 'Perfil');

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles' and column_name = 'birth_date'
  ) then
    execute 'update public.profiles set birthdate = coalesce(birthdate, birth_date)';
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles' and column_name = 'premium'
  ) then
    execute 'update public.profiles set is_premium = coalesce(is_premium, premium, false)';
  end if;
end;
$$;

-- H-015: La vista usa security_definer (por defecto en PostgreSQL) porque necesita
-- acceder a perfiles activos sin exponer filas privadas. El filtro where (deleted_at,
-- is_paused, shadowbanned) actúa como la capa de privacidad; RLS en la tabla base
-- ya está habilitado y la vista hereda las políticas del propietario.
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

-- migrate: down
drop view if exists public.public_profiles;
