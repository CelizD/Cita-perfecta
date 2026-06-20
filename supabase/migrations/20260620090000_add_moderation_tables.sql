-- Cita Perfecta - revisiones de moderacion de imagenes

create table if not exists public.image_moderation_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  image_url_private text not null,
  provider text not null default 'edge-function',
  result_json jsonb not null default '{}'::jsonb,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'manual_review')),
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists image_moderation_reviews_user_id_idx
on public.image_moderation_reviews(user_id);

create index if not exists image_moderation_reviews_status_idx
on public.image_moderation_reviews(status);

alter table public.image_moderation_reviews enable row level security;

drop policy if exists "image_reviews_insert_own" on public.image_moderation_reviews;
create policy "image_reviews_insert_own"
on public.image_moderation_reviews
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "image_reviews_select_own" on public.image_moderation_reviews;
create policy "image_reviews_select_own"
on public.image_moderation_reviews
for select
to authenticated
using (auth.uid() = user_id);
