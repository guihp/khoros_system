-- KHOROS — Row Level Security (Supabase)
--
-- Princípios:
--   · Escrita financeira/de sessão SEMPRE via API com service_role (bypassa RLS).
--   · RLS protege LEITURA direta pelo client Supabase no front.
--   · Prontuário: só o psicólogo autor — nem admin lê conteúdo.
--   · auth.uid() = users.id (espelho de auth.users).

-- Helper: papel do usuário autenticado.
create or replace function current_user_role() returns user_role
language sql stable security definer set search_path = public as $$
  select role from users where id = auth.uid()
$$;

create or replace function is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from users where id = auth.uid() and role = 'ADMIN')
$$;

-- ─── users ───────────────────────────────────────────────────────────────────
alter table users enable row level security;

create policy users_self_read on users
  for select using (id = auth.uid() or is_admin());

create policy users_self_update on users
  for update using (id = auth.uid())
  with check (id = auth.uid());
-- (colunas sensíveis como role/status são protegidas por não estarem expostas
--  na API pública; mudanças administrativas passam pelo service_role)

-- ─── psychologist_profiles ───────────────────────────────────────────────────
alter table psychologist_profiles enable row level security;

-- Perfis VERIFICADOS são públicos (marketplace); o dono e o admin veem sempre.
create policy psy_public_read on psychologist_profiles
  for select using (
    crp_status = 'VERIFIED' or user_id = auth.uid() or is_admin()
  );

create policy psy_self_update on psychologist_profiles
  for update using (user_id = auth.uid())
  with check (user_id = auth.uid() and crp_status = (
    select crp_status from psychologist_profiles p where p.user_id = auth.uid()
  ));
-- crp_status imutável pelo próprio psicólogo: só admin via service_role.

-- ─── patient_profiles ────────────────────────────────────────────────────────
alter table patient_profiles enable row level security;

create policy patient_self on patient_profiles
  for select using (user_id = auth.uid() or is_admin());

create policy patient_self_update on patient_profiles
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ─── wallets / ledger ────────────────────────────────────────────────────────
alter table wallets enable row level security;
alter table ledger_entries enable row level security;

create policy wallet_owner_read on wallets
  for select using (user_id = auth.uid() or is_admin());

create policy ledger_owner_read on ledger_entries
  for select using (wallet_id = auth.uid() or is_admin());
-- Sem policies de INSERT/UPDATE/DELETE: escrita só via service_role.

-- ─── sessions ────────────────────────────────────────────────────────────────
alter table sessions enable row level security;

create policy session_participants_read on sessions
  for select using (
    patient_id = auth.uid() or psychologist_id = auth.uid() or is_admin()
  );

-- ─── heartbeat windows ───────────────────────────────────────────────────────
alter table session_heartbeat_windows enable row level security;

create policy hb_admin_read on session_heartbeat_windows
  for select using (is_admin());

-- ─── consents / triagem ──────────────────────────────────────────────────────
alter table consents enable row level security;

create policy consents_owner_read on consents
  for select using (user_id = auth.uid() or is_admin());

alter table crisis_screenings enable row level security;

create policy screenings_owner_read on crisis_screenings
  for select using (patient_id = auth.uid() or is_admin());

-- ─── prontuário: SÓ o psicólogo autor ────────────────────────────────────────
alter table clinical_records enable row level security;

create policy clinical_author_only on clinical_records
  for all using (psychologist_id = auth.uid())
  with check (psychologist_id = auth.uid());
-- Deliberadamente SEM cláusula de admin: conteúdo clínico é sigiloso.

alter table clinical_record_access_log enable row level security;

create policy clinical_log_admin_read on clinical_record_access_log
  for select using (is_admin());

-- ─── reviews / payouts / settings / audit ────────────────────────────────────
alter table reviews enable row level security;

create policy reviews_public_read on reviews
  for select using (publicado = true or is_admin()
    or exists (select 1 from sessions s
               where s.id = reviews.session_id
                 and (s.patient_id = auth.uid() or s.psychologist_id = auth.uid())));

alter table payouts enable row level security;

create policy payouts_owner_read on payouts
  for select using (psychologist_id = auth.uid() or is_admin());

alter table platform_settings enable row level security;

create policy settings_public_read on platform_settings
  for select using (true);   -- piso/teto/versões de termos são públicos

alter table audit_log enable row level security;

create policy audit_admin_read on audit_log
  for select using (is_admin());
