-- ============================================================
-- FIX 1: Recrear swipes con referencias a auth.users (no profiles)
-- Seguro de ejecutar: si hay datos de prueba los pierde, pero
-- para un proyecto de escuela no importa.
-- ============================================================

drop table if exists public.swipes cascade;

create table public.swipes (
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

alter table public.swipes enable row level security;

create policy "swipes_insert_own" on public.swipes
for insert to authenticated with check (auth.uid() = from_user_id);

create policy "swipes_update_own" on public.swipes
for update to authenticated
using (auth.uid() = from_user_id) with check (auth.uid() = from_user_id);

create policy "swipes_select_related" on public.swipes
for select to authenticated
using (auth.uid() = from_user_id or auth.uid() = to_user_id);

-- ============================================================
-- FIX 2: Asegurar que matches también referencia auth.users
-- ============================================================

drop table if exists public.messages cascade;
drop table if exists public.chats cascade;
drop table if exists public.matches cascade;

create table public.matches (
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

create index if not exists matches_user_a_idx on public.matches(user_a);
create index if not exists matches_user_b_idx on public.matches(user_b);

alter table public.matches enable row level security;

create policy "matches_select_own" on public.matches
for select to authenticated using (auth.uid() = user_a or auth.uid() = user_b);

create policy "matches_insert_own" on public.matches
for insert to authenticated with check (auth.uid() = user_a or auth.uid() = user_b);

create policy "matches_update_own" on public.matches
for update to authenticated
using (auth.uid() = user_a or auth.uid() = user_b)
with check (auth.uid() = user_a or auth.uid() = user_b);

create table public.chats (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches(id) on delete cascade,
  status text not null default 'active' check (status in ('active', 'closed')),
  close_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (match_id)
);

create index if not exists chats_match_id_idx on public.chats(match_id);

alter table public.chats enable row level security;

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
using (exists (select 1 from public.matches where matches.id = chats.match_id
    and (matches.user_a = auth.uid() or matches.user_b = auth.uid())))
with check (exists (select 1 from public.matches where matches.id = chats.match_id
    and (matches.user_a = auth.uid() or matches.user_b = auth.uid())));

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  chat_id uuid not null references public.chats(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  content text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists messages_chat_created_idx on public.messages(chat_id, created_at);

alter table public.messages enable row level security;

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

-- Realtime
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public' and tablename = 'messages'
  ) then
    alter publication supabase_realtime add table public.messages;
  end if;
end;
$$;

-- ============================================================
-- FIX 3: Verificar / crear perfil para el usuario actual
-- (por si el trigger no lo creó)
-- ============================================================

insert into public.profiles (id, user_id, email, name, is_onboarded)
select
  id,
  id as user_id,
  coalesce(email, ''),
  coalesce(raw_user_meta_data ->> 'name', split_part(coalesce(email,'usuario@'),'@',1)),
  false
from auth.users
on conflict (id) do update set
  user_id = excluded.user_id,
  email = excluded.email;

select 'OK: swipes, matches, chats y messages recreados correctamente' as resultado;
