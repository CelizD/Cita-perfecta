-- migrate: up
-- Cita Perfecta - arregla error 500 en signup cuando el trigger de profiles falla

alter table public.profiles
add column if not exists email text,
add column if not exists full_name text,
add column if not exists name text,
add column if not exists user_id uuid references auth.users(id) on delete cascade,
add column if not exists birth_date date,
add column if not exists birthdate date,
add column if not exists age int,
add column if not exists city text,
add column if not exists bio text,
add column if not exists interests text[] not null default '{}',
add column if not exists traits text[] not null default '{}',
add column if not exists dealbreakers text[] not null default '{}',
add column if not exists pact_accepted boolean not null default false,
add column if not exists is_onboarded boolean not null default false,
add column if not exists profile_complete boolean not null default false,
add column if not exists test_complete boolean not null default false,
add column if not exists pause_mode boolean not null default false,
add column if not exists is_paused boolean not null default false,
add column if not exists premium boolean not null default false,
add column if not exists created_at timestamptz not null default now(),
add column if not exists updated_at timestamptz not null default now();

create or replace function public.safe_date_from_text(value text)
returns date
language plpgsql
immutable
as $$
begin
  if value is null or value = '' then
    return null;
  end if;

  if value ~ '^\d{4}-\d{2}-\d{2}$' then
    return value::date;
  end if;

  return null;
exception
  when others then
    return null;
end;
$$;

create or replace function public.safe_int_from_text(value text)
returns int
language plpgsql
immutable
as $$
begin
  if value is null or value = '' then
    return null;
  end if;

  if value ~ '^\d+$' then
    return value::int;
  end if;

  return null;
exception
  when others then
    return null;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  display_name text;
  parsed_birth_date date;
  parsed_age int;
begin
  display_name := coalesce(
    new.raw_user_meta_data ->> 'name',
    new.raw_user_meta_data ->> 'fullName',
    split_part(coalesce(new.email, 'usuario'), '@', 1),
    'Usuario'
  );

  parsed_birth_date := public.safe_date_from_text(
    coalesce(
      new.raw_user_meta_data ->> 'birthDate',
      new.raw_user_meta_data ->> 'birth_date',
      new.raw_user_meta_data ->> 'birthdate'
    )
  );

  parsed_age := public.safe_int_from_text(new.raw_user_meta_data ->> 'age');

  insert into public.profiles (
    id,
    user_id,
    email,
    full_name,
    name,
    birth_date,
    birthdate,
    age,
    interests,
    traits,
    dealbreakers,
    pact_accepted,
    is_onboarded,
    profile_complete,
    test_complete,
    pause_mode,
    is_paused,
    premium
  )
  values (
    new.id,
    new.id,
    coalesce(new.email, ''),
    display_name,
    display_name,
    parsed_birth_date,
    parsed_birth_date,
    parsed_age,
    '{}',
    '{}',
    '{}',
    false,
    false,
    false,
    false,
    false,
    false,
    false
  )
  on conflict (id) do update set
    user_id = excluded.user_id,
    email = excluded.email,
    full_name = coalesce(public.profiles.full_name, excluded.full_name),
    name = coalesce(public.profiles.name, excluded.name),
    birth_date = coalesce(public.profiles.birth_date, excluded.birth_date),
    birthdate = coalesce(public.profiles.birthdate, excluded.birthdate),
    age = coalesce(public.profiles.age, excluded.age),
    updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- migrate: down
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();
drop function if exists public.safe_date_from_text(text);
drop function if exists public.safe_int_from_text(text);
