-- Cita Perfecta - indices de rendimiento para explore, matches y chat

create index if not exists swipes_from_to_idx
on public.swipes(from_user_id, to_user_id);

create index if not exists swipes_to_from_action_idx
on public.swipes(to_user_id, from_user_id, action);

create index if not exists matches_users_idx
on public.matches(user_a, user_b);

create index if not exists matches_user_a_status_idx
on public.matches(user_a, status);

create index if not exists matches_user_b_status_idx
on public.matches(user_b, status);

create index if not exists messages_chat_created_idx
on public.messages(chat_id, created_at);

create index if not exists blocks_blocker_blocked_idx
on public.blocks(blocker_id, blocked_user_id);

create table if not exists public.user_devices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  expo_push_token text,
  fcm_token text,
  platform text not null default 'web',
  device_name text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (expo_push_token is not null or fcm_token is not null)
);

create index if not exists user_devices_user_id_idx
on public.user_devices(user_id);

create unique index if not exists user_devices_expo_push_token_uidx
on public.user_devices(expo_push_token)
where expo_push_token is not null;

create unique index if not exists user_devices_fcm_token_uidx
on public.user_devices(fcm_token)
where fcm_token is not null;

alter table public.user_devices enable row level security;

drop policy if exists "user_devices_manage_own" on public.user_devices;
create policy "user_devices_manage_own"
on public.user_devices
for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
