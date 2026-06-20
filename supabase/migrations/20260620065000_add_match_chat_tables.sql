-- Cita Perfecta - Match, explore y chat MVP
-- Dependencias: auth.users y tablas public.profiles, public.swipes, public.matches,
-- public.chats, public.messages, public.blocks.

create extension if not exists "pgcrypto";

-- =========================================================
-- Profiles: campos reales que consume ExploreComponent
-- =========================================================

alter table public.profiles
add column if not exists user_id uuid references auth.users(id) on delete cascade,
add column if not exists name text,
add column if not exists main_photo_url text,
add column if not exists deleted_at timestamptz,
add column if not exists is_paused boolean not null default false;

update public.profiles
set
  user_id = coalesce(user_id, id),
  name = coalesce(name, full_name),
  main_photo_url = coalesce(main_photo_url, photo_url),
  is_paused = coalesce(is_paused, pause_mode, false)
where user_id is null
   or name is null
   or main_photo_url is null;

create unique index if not exists profiles_user_id_uidx
on public.profiles(user_id);

create index if not exists profiles_explore_idx
on public.profiles(user_id, deleted_at, is_paused);

-- =========================================================
-- Swipes: like/pass y exclusion de perfiles ya vistos
-- =========================================================

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

create index if not exists swipes_from_user_id_idx
on public.swipes(from_user_id);

create index if not exists swipes_to_user_id_idx
on public.swipes(to_user_id);

create index if not exists swipes_mutual_like_idx
on public.swipes(from_user_id, to_user_id, action);

-- =========================================================
-- Matches: match activo con expiracion de 72 horas
-- =========================================================

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

alter table public.matches
add column if not exists expires_at timestamptz not null default (now() + interval '72 hours');

create index if not exists matches_user_a_idx
on public.matches(user_a);

create index if not exists matches_user_b_idx
on public.matches(user_b);

create index if not exists matches_status_idx
on public.matches(status);

-- =========================================================
-- Chats y mensajes
-- =========================================================

create table if not exists public.chats (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches(id) on delete cascade,
  status text not null default 'active' check (status in ('active', 'closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (match_id)
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  chat_id uuid not null references public.chats(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  content text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.messages
add column if not exists read_at timestamptz;

create index if not exists chats_match_id_idx
on public.chats(match_id);

create index if not exists messages_chat_created_idx
on public.messages(chat_id, created_at);

create index if not exists messages_unread_idx
on public.messages(chat_id, sender_id, read_at);

-- =========================================================
-- Blocks
-- =========================================================

create table if not exists public.blocks (
  id uuid primary key default gen_random_uuid(),
  blocker_id uuid not null references auth.users(id) on delete cascade,
  blocked_user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (blocker_id, blocked_user_id),
  check (blocker_id <> blocked_user_id)
);

create index if not exists blocks_blocker_blocked_idx
on public.blocks(blocker_id, blocked_user_id);

-- =========================================================
-- RLS
-- =========================================================

alter table public.profiles enable row level security;
alter table public.swipes enable row level security;
alter table public.matches enable row level security;
alter table public.chats enable row level security;
alter table public.messages enable row level security;
alter table public.blocks enable row level security;

drop policy if exists "profiles_select_authenticated" on public.profiles;
create policy "profiles_select_authenticated"
on public.profiles
for select
to authenticated
using (deleted_at is null);

drop policy if exists "profiles_update_own_user_id" on public.profiles;
create policy "profiles_update_own_user_id"
on public.profiles
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "swipes_insert_own" on public.swipes;
create policy "swipes_insert_own"
on public.swipes
for insert
to authenticated
with check (auth.uid() = from_user_id);

drop policy if exists "swipes_update_own" on public.swipes;
create policy "swipes_update_own"
on public.swipes
for update
to authenticated
using (auth.uid() = from_user_id)
with check (auth.uid() = from_user_id);

drop policy if exists "swipes_select_related" on public.swipes;
create policy "swipes_select_related"
on public.swipes
for select
to authenticated
using (auth.uid() = from_user_id or auth.uid() = to_user_id);

drop policy if exists "matches_insert_own" on public.matches;
create policy "matches_insert_own"
on public.matches
for insert
to authenticated
with check (auth.uid() = user_a or auth.uid() = user_b);

drop policy if exists "matches_select_own" on public.matches;
create policy "matches_select_own"
on public.matches
for select
to authenticated
using (auth.uid() = user_a or auth.uid() = user_b);

drop policy if exists "matches_update_own" on public.matches;
create policy "matches_update_own"
on public.matches
for update
to authenticated
using (auth.uid() = user_a or auth.uid() = user_b)
with check (auth.uid() = user_a or auth.uid() = user_b);

drop policy if exists "chats_insert_own_match" on public.chats;
create policy "chats_insert_own_match"
on public.chats
for insert
to authenticated
with check (
  exists (
    select 1
    from public.matches
    where matches.id = chats.match_id
      and (matches.user_a = auth.uid() or matches.user_b = auth.uid())
  )
);

drop policy if exists "chats_select_own" on public.chats;
create policy "chats_select_own"
on public.chats
for select
to authenticated
using (
  exists (
    select 1
    from public.matches
    where matches.id = chats.match_id
      and (matches.user_a = auth.uid() or matches.user_b = auth.uid())
  )
);

drop policy if exists "messages_insert_own_chat" on public.messages;
create policy "messages_insert_own_chat"
on public.messages
for insert
to authenticated
with check (
  auth.uid() = sender_id
  and exists (
    select 1
    from public.chats
    join public.matches on matches.id = chats.match_id
    where chats.id = messages.chat_id
      and (matches.user_a = auth.uid() or matches.user_b = auth.uid())
  )
);

drop policy if exists "messages_select_own_chat" on public.messages;
create policy "messages_select_own_chat"
on public.messages
for select
to authenticated
using (
  exists (
    select 1
    from public.chats
    join public.matches on matches.id = chats.match_id
    where chats.id = messages.chat_id
      and (matches.user_a = auth.uid() or matches.user_b = auth.uid())
  )
);

drop policy if exists "messages_update_read_own_chat" on public.messages;
create policy "messages_update_read_own_chat"
on public.messages
for update
to authenticated
using (
  exists (
    select 1
    from public.chats
    join public.matches on matches.id = chats.match_id
    where chats.id = messages.chat_id
      and (matches.user_a = auth.uid() or matches.user_b = auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.chats
    join public.matches on matches.id = chats.match_id
    where chats.id = messages.chat_id
      and (matches.user_a = auth.uid() or matches.user_b = auth.uid())
  )
);

drop policy if exists "blocks_manage_own" on public.blocks;
create policy "blocks_manage_own"
on public.blocks
for all
to authenticated
using (auth.uid() = blocker_id)
with check (auth.uid() = blocker_id);

-- =========================================================
-- Realtime para mensajes
-- =========================================================

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'messages'
  ) then
    alter publication supabase_realtime add table public.messages;
  end if;
end;
$$;
