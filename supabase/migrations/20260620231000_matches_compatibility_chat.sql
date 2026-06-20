-- Cita Perfecta - Compatibilidad, swipes, matches y chat realtime
-- Requiere que existan las tablas:
-- profiles, questions, answers, swipes, matches, chats, messages, blocks, reports.

-- =========================================================
-- Columnas requeridas por onboarding y compatibilidad
-- =========================================================

alter table public.profiles
add column if not exists is_onboarded boolean not null default false;

alter table public.questions
add column if not exists is_initial boolean not null default true;

-- =========================================================
-- Indices para consultas de compatibilidad, swipes y chat
-- =========================================================

create index if not exists questions_initial_active_idx
on public.questions(is_initial, is_active);

create index if not exists answers_user_question_idx
on public.answers(user_id, question_id);

create index if not exists swipes_from_to_action_idx
on public.swipes(from_user_id, to_user_id, action);

create index if not exists matches_users_status_idx
on public.matches(user_a, user_b, status);

create index if not exists chats_match_id_idx
on public.chats(match_id);

create index if not exists messages_chat_created_idx
on public.messages(chat_id, created_at);

create index if not exists blocks_blocker_blocked_idx
on public.blocks(blocker_id, blocked_user_id);

create index if not exists reports_reporter_reported_idx
on public.reports(reporter_id, reported_user_id);

-- =========================================================
-- RLS habilitado
-- =========================================================

alter table public.profiles enable row level security;
alter table public.questions enable row level security;
alter table public.answers enable row level security;
alter table public.swipes enable row level security;
alter table public.matches enable row level security;
alter table public.chats enable row level security;
alter table public.messages enable row level security;
alter table public.blocks enable row level security;
alter table public.reports enable row level security;

-- =========================================================
-- Policies para profiles
-- =========================================================

drop policy if exists "profiles_select_authenticated" on public.profiles;
create policy "profiles_select_authenticated"
on public.profiles
for select
to authenticated
using (true);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
on public.profiles
for insert
to authenticated
with check (auth.uid() = id);

-- =========================================================
-- Policies para questions y answers
-- =========================================================

drop policy if exists "questions_select_initial" on public.questions;
create policy "questions_select_initial"
on public.questions
for select
to authenticated
using (is_active = true);

drop policy if exists "answers_manage_own" on public.answers;
create policy "answers_manage_own"
on public.answers
for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- =========================================================
-- Policies para swipes
-- =========================================================

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

-- =========================================================
-- Policies para matches
-- Permiten crear match desde el cliente cuando hay like mutuo.
-- =========================================================

drop policy if exists "matches_select_own" on public.matches;
create policy "matches_select_own"
on public.matches
for select
to authenticated
using (auth.uid() = user_a or auth.uid() = user_b);

drop policy if exists "matches_insert_own" on public.matches;
create policy "matches_insert_own"
on public.matches
for insert
to authenticated
with check (auth.uid() = user_a or auth.uid() = user_b);

drop policy if exists "matches_update_own" on public.matches;
create policy "matches_update_own"
on public.matches
for update
to authenticated
using (auth.uid() = user_a or auth.uid() = user_b)
with check (auth.uid() = user_a or auth.uid() = user_b);

-- =========================================================
-- Policies para chats
-- =========================================================

drop policy if exists "chats_select_own" on public.chats;
create policy "chats_select_own"
on public.chats
for select
to authenticated
using (
  exists (
    select 1 from public.matches
    where matches.id = chats.match_id
      and (matches.user_a = auth.uid() or matches.user_b = auth.uid())
  )
);

drop policy if exists "chats_insert_own_match" on public.chats;
create policy "chats_insert_own_match"
on public.chats
for insert
to authenticated
with check (
  exists (
    select 1 from public.matches
    where matches.id = chats.match_id
      and (matches.user_a = auth.uid() or matches.user_b = auth.uid())
  )
);

drop policy if exists "chats_update_own" on public.chats;
create policy "chats_update_own"
on public.chats
for update
to authenticated
using (
  exists (
    select 1 from public.matches
    where matches.id = chats.match_id
      and (matches.user_a = auth.uid() or matches.user_b = auth.uid())
  )
)
with check (
  exists (
    select 1 from public.matches
    where matches.id = chats.match_id
      and (matches.user_a = auth.uid() or matches.user_b = auth.uid())
  )
);

-- =========================================================
-- Policies para messages
-- =========================================================

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

-- =========================================================
-- Policies para blocks y reports
-- =========================================================

drop policy if exists "blocks_manage_own" on public.blocks;
create policy "blocks_manage_own"
on public.blocks
for all
to authenticated
using (auth.uid() = blocker_id)
with check (auth.uid() = blocker_id);

drop policy if exists "reports_insert_own" on public.reports;
create policy "reports_insert_own"
on public.reports
for insert
to authenticated
with check (auth.uid() = reporter_id);

drop policy if exists "reports_select_own" on public.reports;
create policy "reports_select_own"
on public.reports
for select
to authenticated
using (auth.uid() = reporter_id);

-- =========================================================
-- Realtime para messages
-- Agrega public.messages a la publicacion de Supabase Realtime si no existe.
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
