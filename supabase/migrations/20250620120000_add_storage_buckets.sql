-- Cita Perfecta - Supabase Storage para fotos de perfil

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'profile-photos',
  'profile-photos',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'temp-moderation',
  'temp-moderation',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

alter table public.profiles
add column if not exists main_photo_url text,
add column if not exists photo_url text,
add column if not exists photo_profile text,
add column if not exists photos text[] not null default '{}';

drop policy if exists "profile_photos_insert_own_folder" on storage.objects;
create policy "profile_photos_insert_own_folder"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'profile-photos'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "profile_photos_update_own_folder" on storage.objects;
create policy "profile_photos_update_own_folder"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'profile-photos'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'profile-photos'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "profile_photos_delete_own_folder" on storage.objects;
create policy "profile_photos_delete_own_folder"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'profile-photos'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "profile_photos_public_read" on storage.objects;
create policy "profile_photos_public_read"
on storage.objects
for select
to public
using (bucket_id = 'profile-photos');

drop policy if exists "temp_moderation_manage_own_folder" on storage.objects;
create policy "temp_moderation_manage_own_folder"
on storage.objects
for all
to authenticated
using (
  bucket_id = 'temp-moderation'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'temp-moderation'
  and (storage.foldername(name))[1] = auth.uid()::text
);
