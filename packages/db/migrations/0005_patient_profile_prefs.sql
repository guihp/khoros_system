-- KHOROS — Preferências e perfil estendido do paciente
-- Espelho da migration MCP `patient_profile_prefs`.

alter table patient_profiles
  add column if not exists foto_url text,
  add column if not exists bio text,
  add column if not exists mostrar_nome_real boolean not null default false,
  add column if not exists camera_ligada_padrao boolean not null default true;

-- Índice para histórico do paciente
create index if not exists sessions_patient_status_ended_idx
  on sessions (patient_id, status, ended_at desc);

-- Bucket público para fotos de perfil de pacientes (API sobe via service role).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'patient-avatars',
  'patient-avatars',
  true,
  2097152,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "patient_avatars_public_read" on storage.objects;
create policy "patient_avatars_public_read"
  on storage.objects for select
  to public
  using (bucket_id = 'patient-avatars');
