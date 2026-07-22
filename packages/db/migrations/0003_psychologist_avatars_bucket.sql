-- Bucket público para fotos de perfil de psicólogos (API sobe via service role).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'psychologist-avatars',
  'psychologist-avatars',
  true,
  2097152,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "psychologist_avatars_public_read" on storage.objects;
create policy "psychologist_avatars_public_read"
  on storage.objects for select
  to public
  using (bucket_id = 'psychologist-avatars');
