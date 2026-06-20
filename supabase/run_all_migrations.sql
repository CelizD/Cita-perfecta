-- ============================================================
-- Cita Perfecta - Schema completo
-- Pega en Supabase > SQL Editor y ejecuta.
-- ============================================================

create extension if not exists "pgcrypto";

-- ============================================================
-- Funciones helper
-- ============================================================

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create or replace function public.safe_date_from_text(value text)
returns date language plpgsql immutable as $$
begin
  if value is null or value = '' then return null; end if;
  if value ~ '^\d{4}-\d{2}-\d{2}$' then return value::date; end if;
  return null;
exception when others then return null;
end;
$$;

create or replace function public.safe_int_from_text(value text)
returns int language plpgsql immutable as $$
begin
  if value is null or value = '' then return null; end if;
  if value ~ '^\d+$' then return value::int; end if;
  return null;
exception when others then return null;
end;
$$;

create or replace function public.is_admin()
returns boolean language sql stable as $$
  select coalesce(
    (auth.jwt() -> 'app_metadata' ->> 'app_role') = 'admin'
    or (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
    or (auth.jwt() -> 'app_metadata' ->> 'is_admin') = 'true',
    false
  );
$$;

grant execute on function public.is_admin() to authenticated;

-- ============================================================
-- Tabla: profiles
-- ============================================================

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  email text not null default '',
  full_name text,
  name text,
  username text unique,
  birth_date date,
  birthdate date,
  age int,
  city text,
  bio text,
  photo_url text,
  photo_profile text,
  photos text[] not null default '{}',
  main_photo_url text,
  main_photo_path text,
  interests text[] not null default '{}',
  traits text[] not null default '{}',
  communication_style text,
  love_language text,
  dealbreakers text[] not null default '{}',
  aura_name text,
  pact_accepted boolean not null default false,
  is_onboarded boolean not null default false,
  profile_complete boolean not null default false,
  test_complete boolean not null default false,
  pause_mode boolean not null default false,
  is_paused boolean not null default false,
  premium boolean not null default false,
  is_premium boolean not null default false,
  is_verified boolean not null default false,
  shadowbanned boolean not null default false,
  deleted_at timestamptz,
  letters_used_this_month int not null default 0,
  letters_reset_at timestamptz not null default (now() + interval '1 month'),
  terms_accepted_at timestamptz,
  terms_version varchar(10) default '1.0',
  privacy_accepted_at timestamptz,
  privacy_version varchar(10) default '1.0',
  data_consent_given boolean not null default false,
  data_consent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

-- Sincronizar user_id = id en filas existentes
update public.profiles set user_id = coalesce(user_id, id), name = coalesce(name, 'Perfil');

create unique index if not exists profiles_user_id_uidx on public.profiles(user_id);
create index if not exists profiles_explore_idx on public.profiles(user_id, deleted_at, is_paused);
create index if not exists idx_profiles_public_feed on public.profiles(deleted_at, is_paused, shadowbanned, created_at);

-- ============================================================
-- Trigger: crear perfil al registrarse
-- ============================================================

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
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
  parsed_birth_date := public.safe_date_from_text(coalesce(
    new.raw_user_meta_data ->> 'birthDate',
    new.raw_user_meta_data ->> 'birth_date',
    new.raw_user_meta_data ->> 'birthdate'
  ));
  parsed_age := public.safe_int_from_text(new.raw_user_meta_data ->> 'age');

  insert into public.profiles (
    id, user_id, email, full_name, name, birth_date, birthdate, age,
    interests, traits, dealbreakers, pact_accepted, is_onboarded,
    profile_complete, test_complete, pause_mode, is_paused, premium
  ) values (
    new.id, new.id, coalesce(new.email, ''), display_name, display_name,
    parsed_birth_date, parsed_birth_date, parsed_age,
    '{}', '{}', '{}', false, false, false, false, false, false, false
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

-- ============================================================
-- Tabla: questions
-- ============================================================

create table if not exists public.questions (
  id bigint generated by default as identity primary key,
  text text not null,
  category text not null default 'general',
  weight int not null default 1,
  is_initial boolean not null default true,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

insert into public.questions (id, text, category, weight, is_initial, is_active) values
  (1, 'Me gusta hablar con claridad cuando algo me incomoda.', 'comunicacion', 2, true, true),
  (2, 'Busco una relacion tranquila, honesta y con respeto.', 'valores', 2, true, true),
  (3, 'Prefiero planes tranquilos antes que salir de fiesta todo el tiempo.', 'estilo', 1, true, true),
  (4, 'Para mi es importante tener metas personales claras.', 'metas', 2, true, true),
  (5, 'Me gusta conocer a alguien con calma, sin presiones.', 'valores', 2, true, true),
  (6, 'Disfruto conversaciones profundas sobre la vida y emociones.', 'comunicacion', 1, true, true),
  (7, 'Valoro mucho el tiempo de calidad.', 'valores', 2, true, true),
  (8, 'Me gusta compartir gustos como musica, peliculas o tecnologia.', 'intereses', 1, true, true),
  (9, 'Cuando algo termina, prefiero cerrar con respeto y claridad.', 'comunicacion', 2, true, true),
  (10, 'Me interesa una conexion real, no solo una coincidencia rapida.', 'metas', 2, true, true)
on conflict (id) do update set
  text = excluded.text, category = excluded.category,
  weight = excluded.weight, is_initial = excluded.is_initial, is_active = excluded.is_active;

select setval(pg_get_serial_sequence('public.questions', 'id'),
  greatest((select coalesce(max(id), 1) from public.questions), 1), true);

-- ============================================================
-- Tabla: answers
-- ============================================================

create table if not exists public.answers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  question_id bigint not null references public.questions(id) on delete cascade,
  value int not null check (value between 1 and 5),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, question_id)
);

drop trigger if exists answers_set_updated_at on public.answers;
create trigger answers_set_updated_at
before update on public.answers
for each row execute function public.set_updated_at();

-- ============================================================
-- Tabla: swipes
-- ============================================================

create table if not exists public.swipes (
  id uuid primary key default gen_random_uuid(),
  from_user_id uuid not null references auth.users(id) on delete cascade,
  to_user_id uuid not null references auth.users(id) on delete cascade,
  action text not null check (action in ('like', 'pass')),
  comment text,
  created_at timestamptz not null default now(),
  unique (from_user_id, to_user_id),
  check (from_user_id <> to_user_id)
);

create index if not exists swipes_from_to_idx on public.swipes(from_user_id, to_user_id);
create index if not exists swipes_to_from_action_idx on public.swipes(to_user_id, from_user_id, action);

-- ============================================================
-- Tabla: matches
-- ============================================================

create table if not exists public.matches (
  id uuid primary key default gen_random_uuid(),
  user_a uuid not null references auth.users(id) on delete cascade,
  user_b uuid not null references auth.users(id) on delete cascade,
  compatibility int not null default 80 check (compatibility between 0 and 100),
  status text not null default 'active' check (status in ('active', 'closed')),
  expires_at timestamptz not null default (now() + interval '72 hours'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_a, user_b),
  check (user_a <> user_b)
);

drop trigger if exists matches_set_updated_at on public.matches;
create trigger matches_set_updated_at
before update on public.matches
for each row execute function public.set_updated_at();

create index if not exists matches_user_a_idx on public.matches(user_a);
create index if not exists matches_user_b_idx on public.matches(user_b);
create index if not exists matches_users_status_idx on public.matches(user_a, user_b, status);

-- ============================================================
-- Tabla: chats
-- ============================================================

create table if not exists public.chats (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches(id) on delete cascade,
  status text not null default 'active' check (status in ('active', 'closed')),
  close_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (match_id)
);

drop trigger if exists chats_set_updated_at on public.chats;
create trigger chats_set_updated_at
before update on public.chats
for each row execute function public.set_updated_at();

create index if not exists chats_match_id_idx on public.chats(match_id);

-- ============================================================
-- Tabla: messages
-- ============================================================

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  chat_id uuid not null references public.chats(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  content text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists messages_chat_created_idx on public.messages(chat_id, created_at);
create index if not exists messages_unread_idx on public.messages(chat_id, sender_id, read_at);

-- ============================================================
-- Tabla: connection_letters
-- ============================================================

create table if not exists public.connection_letters (
  id uuid primary key default gen_random_uuid(),
  from_user_id uuid not null references auth.users(id) on delete cascade,
  to_user_id uuid not null references auth.users(id) on delete cascade,
  message text not null,
  status text not null default 'sent' check (status in ('sent', 'read', 'accepted', 'rejected')),
  read_at timestamptz,
  created_at timestamptz not null default now(),
  check (from_user_id <> to_user_id)
);

create index if not exists connection_letters_from_created_idx on public.connection_letters(from_user_id, created_at);
create index if not exists connection_letters_to_created_idx on public.connection_letters(to_user_id, created_at);

-- ============================================================
-- Tabla: blocks
-- ============================================================

create table if not exists public.blocks (
  id uuid primary key default gen_random_uuid(),
  blocker_id uuid not null references auth.users(id) on delete cascade,
  blocked_user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (blocker_id, blocked_user_id),
  check (blocker_id <> blocked_user_id)
);

create index if not exists blocks_blocker_blocked_idx on public.blocks(blocker_id, blocked_user_id);

-- ============================================================
-- Tabla: reports
-- ============================================================

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references auth.users(id) on delete cascade,
  reported_user_id uuid not null references auth.users(id) on delete cascade,
  reason text not null,
  description text,
  status text not null default 'pending' check (status in ('pending', 'reviewed', 'resolved', 'dismissed')),
  created_at timestamptz not null default now(),
  check (reporter_id <> reported_user_id)
);

create index if not exists reports_reporter_reported_idx on public.reports(reporter_id, reported_user_id);

-- ============================================================
-- Storage: bucket para fotos de perfil
-- ============================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('profile-photos', 'profile-photos', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "profile_photos_insert_own_folder" on storage.objects;
create policy "profile_photos_insert_own_folder" on storage.objects
for insert to authenticated
with check (bucket_id = 'profile-photos' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "profile_photos_update_own_folder" on storage.objects;
create policy "profile_photos_update_own_folder" on storage.objects
for update to authenticated
using (bucket_id = 'profile-photos' and (storage.foldername(name))[1] = auth.uid()::text)
with check (bucket_id = 'profile-photos' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "profile_photos_delete_own_folder" on storage.objects;
create policy "profile_photos_delete_own_folder" on storage.objects
for delete to authenticated
using (bucket_id = 'profile-photos' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "profile_photos_authenticated_read" on storage.objects;
create policy "profile_photos_authenticated_read" on storage.objects
for select to authenticated
using (bucket_id = 'profile-photos');

-- ============================================================
-- Vista: public_profiles (perfiles seguros para Explore)
-- ============================================================

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
      select 1 from public.blocks
      where (blocks.blocker_id = auth.uid() and blocks.blocked_user_id = coalesce(profiles.user_id, profiles.id))
         or (blocks.blocker_id = coalesce(profiles.user_id, profiles.id) and blocks.blocked_user_id = auth.uid())
    )
  );

revoke all on public.public_profiles from anon;
grant select on public.public_profiles to authenticated;

-- ============================================================
-- RLS
-- ============================================================

alter table public.profiles enable row level security;
alter table public.questions enable row level security;
alter table public.answers enable row level security;
alter table public.swipes enable row level security;
alter table public.matches enable row level security;
alter table public.chats enable row level security;
alter table public.messages enable row level security;
alter table public.connection_letters enable row level security;
alter table public.blocks enable row level security;
alter table public.reports enable row level security;

-- profiles
drop policy if exists "profiles_select_authenticated" on public.profiles;
drop policy if exists "profiles_select_self_or_admin" on public.profiles;
drop policy if exists "profiles_insert_own" on public.profiles;
drop policy if exists "profiles_insert_self" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;
drop policy if exists "profiles_update_own_user_id" on public.profiles;
drop policy if exists "profiles_update_self" on public.profiles;
drop policy if exists "profiles_delete_self" on public.profiles;

create policy "profiles_select_self_or_admin" on public.profiles
for select to authenticated
using (auth.uid() = coalesce(user_id, id) or public.is_admin());

create policy "profiles_insert_self" on public.profiles
for insert to authenticated
with check (auth.uid() = coalesce(user_id, id));

create policy "profiles_update_self" on public.profiles
for update to authenticated
using (auth.uid() = coalesce(user_id, id) or public.is_admin())
with check (auth.uid() = coalesce(user_id, id) or public.is_admin());

create policy "profiles_delete_self" on public.profiles
for delete to authenticated
using (auth.uid() = coalesce(user_id, id) or public.is_admin());

-- questions
drop policy if exists "questions_select_authenticated" on public.questions;
drop policy if exists "questions_select_initial" on public.questions;
create policy "questions_select_initial" on public.questions
for select to authenticated using (is_active = true);

-- answers
drop policy if exists "answers_manage_own" on public.answers;
drop policy if exists "answers_select_self" on public.answers;
drop policy if exists "answers_insert_self" on public.answers;
drop policy if exists "answers_update_self" on public.answers;

create policy "answers_select_self" on public.answers
for select to authenticated using (auth.uid() = user_id);

create policy "answers_insert_self" on public.answers
for insert to authenticated with check (auth.uid() = user_id);

create policy "answers_update_self" on public.answers
for update to authenticated
using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- swipes
drop policy if exists "swipes_insert_own" on public.swipes;
drop policy if exists "swipes_update_own" on public.swipes;
drop policy if exists "swipes_select_related" on public.swipes;

create policy "swipes_insert_own" on public.swipes
for insert to authenticated with check (auth.uid() = from_user_id);

create policy "swipes_update_own" on public.swipes
for update to authenticated
using (auth.uid() = from_user_id) with check (auth.uid() = from_user_id);

create policy "swipes_select_related" on public.swipes
for select to authenticated
using (auth.uid() = from_user_id or auth.uid() = to_user_id);

-- matches
drop policy if exists "matches_select_own" on public.matches;
drop policy if exists "matches_insert_own" on public.matches;
drop policy if exists "matches_update_own" on public.matches;

create policy "matches_select_own" on public.matches
for select to authenticated using (auth.uid() = user_a or auth.uid() = user_b);

create policy "matches_insert_own" on public.matches
for insert to authenticated with check (auth.uid() = user_a or auth.uid() = user_b);

create policy "matches_update_own" on public.matches
for update to authenticated
using (auth.uid() = user_a or auth.uid() = user_b)
with check (auth.uid() = user_a or auth.uid() = user_b);

-- chats
drop policy if exists "chats_select_own" on public.chats;
drop policy if exists "chats_insert_own_match" on public.chats;
drop policy if exists "chats_update_own" on public.chats;

create policy "chats_select_own" on public.chats
for select to authenticated using (
  exists (select 1 from public.matches
    where matches.id = chats.match_id
      and (matches.user_a = auth.uid() or matches.user_b = auth.uid()))
);

create policy "chats_insert_own_match" on public.chats
for insert to authenticated with check (
  exists (select 1 from public.matches
    where matches.id = chats.match_id
      and (matches.user_a = auth.uid() or matches.user_b = auth.uid()))
);

create policy "chats_update_own" on public.chats
for update to authenticated
using (exists (select 1 from public.matches
    where matches.id = chats.match_id
      and (matches.user_a = auth.uid() or matches.user_b = auth.uid())))
with check (exists (select 1 from public.matches
    where matches.id = chats.match_id
      and (matches.user_a = auth.uid() or matches.user_b = auth.uid())));

-- messages
drop policy if exists "messages_select_own_chat" on public.messages;
drop policy if exists "messages_insert_own_chat" on public.messages;
drop policy if exists "messages_update_read_own_chat" on public.messages;

create policy "messages_select_own_chat" on public.messages
for select to authenticated using (
  exists (select 1 from public.chats
    join public.matches on matches.id = chats.match_id
    where chats.id = messages.chat_id
      and (matches.user_a = auth.uid() or matches.user_b = auth.uid()))
);

create policy "messages_insert_own_chat" on public.messages
for insert to authenticated with check (
  auth.uid() = sender_id and
  exists (select 1 from public.chats
    join public.matches on matches.id = chats.match_id
    where chats.id = messages.chat_id
      and (matches.user_a = auth.uid() or matches.user_b = auth.uid()))
);

create policy "messages_update_read_own_chat" on public.messages
for update to authenticated
using (exists (select 1 from public.chats
    join public.matches on matches.id = chats.match_id
    where chats.id = messages.chat_id
      and (matches.user_a = auth.uid() or matches.user_b = auth.uid())))
with check (exists (select 1 from public.chats
    join public.matches on matches.id = chats.match_id
    where chats.id = messages.chat_id
      and (matches.user_a = auth.uid() or matches.user_b = auth.uid())));

-- connection_letters
drop policy if exists "letters_select_participant" on public.connection_letters;
drop policy if exists "letters_insert_from_user" on public.connection_letters;
drop policy if exists "letters_update_participant" on public.connection_letters;
drop policy if exists "letters_insert_own" on public.connection_letters;
drop policy if exists "letters_select_related" on public.connection_letters;
drop policy if exists "letters_update_receiver" on public.connection_letters;

create policy "letters_select_participant" on public.connection_letters
for select to authenticated using (auth.uid() = from_user_id or auth.uid() = to_user_id);

create policy "letters_insert_from_user" on public.connection_letters
for insert to authenticated with check (auth.uid() = from_user_id);

create policy "letters_update_participant" on public.connection_letters
for update to authenticated
using (auth.uid() = from_user_id or auth.uid() = to_user_id)
with check (auth.uid() = from_user_id or auth.uid() = to_user_id);

-- blocks
drop policy if exists "blocks_manage_own" on public.blocks;
create policy "blocks_manage_own" on public.blocks
for all to authenticated
using (auth.uid() = blocker_id) with check (auth.uid() = blocker_id);

-- reports
drop policy if exists "reports_insert_own" on public.reports;
drop policy if exists "reports_select_own" on public.reports;

create policy "reports_insert_own" on public.reports
for insert to authenticated with check (auth.uid() = reporter_id);

create policy "reports_select_own" on public.reports
for select to authenticated using (auth.uid() = reporter_id);

-- ============================================================
-- RPC: enviar carta de conexion (con cuota mensual)
-- ============================================================

create or replace function public.send_connection_letter(
  p_to_user_id uuid,
  p_message    text
)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_from_user_id uuid := auth.uid();
  v_premium      boolean := false;
  v_used         int     := 0;
  v_reset_at     timestamptz;
  v_quota_limit  int;
begin
  if length(trim(p_message)) < 300 then
    return jsonb_build_object('ok', false, 'error', 'La carta debe tener al menos 300 caracteres.');
  end if;
  if v_from_user_id = p_to_user_id then
    return jsonb_build_object('ok', false, 'error', 'No puedes enviarte una carta a ti mismo.');
  end if;
  select
    coalesce(premium, false) or coalesce(is_premium, false),
    coalesce(letters_used_this_month, 0),
    letters_reset_at
  into v_premium, v_used, v_reset_at
  from public.profiles
  where id = v_from_user_id or user_id = v_from_user_id
  limit 1;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'Perfil no encontrado.');
  end if;
  v_quota_limit := case when v_premium then 10 else 3 end;
  if v_reset_at is null or v_reset_at <= now() then
    update public.profiles
    set letters_used_this_month = 0, letters_reset_at = now() + interval '1 month'
    where id = v_from_user_id or user_id = v_from_user_id;
    v_used := 0;
  end if;
  if v_used >= v_quota_limit then
    return jsonb_build_object('ok', false,
      'error', format('Ya usaste tus %s cartas disponibles de este mes.', v_quota_limit));
  end if;
  insert into public.connection_letters (from_user_id, to_user_id, message, status)
  values (v_from_user_id, p_to_user_id, trim(p_message), 'sent');
  update public.profiles
  set letters_used_this_month = letters_used_this_month + 1
  where id = v_from_user_id or user_id = v_from_user_id;
  return jsonb_build_object('ok', true);
end;
$$;

grant execute on function public.send_connection_letter(uuid, text) to authenticated;

-- ============================================================
-- RPC: activar premium (solo service_role via webhook de pago)
-- ============================================================

create or replace function public.activate_premium(p_user_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  update public.profiles
  set premium = true, is_premium = true, updated_at = now()
  where id = p_user_id or user_id = p_user_id;
end;
$$;

revoke all on function public.activate_premium(uuid) from public, authenticated;

-- ============================================================
-- Realtime para mensajes
-- ============================================================

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'messages'
  ) then
    alter publication supabase_realtime add table public.messages;
  end if;
end;
$$;

-- ============================================================
-- FIN
-- ============================================================
