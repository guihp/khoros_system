-- 0010 — Fecha escrita direta pelo navegador (PostgREST) nas tabelas de domínio.
--
-- Problema: o Supabase concede INSERT/UPDATE/DELETE a `anon`/`authenticated` em
-- todo o schema public por padrão. Com as policies *_self_update, qualquer
-- usuário logado (JWT + publishable key, ambos públicos no browser) podia:
--   - users:                 mudar o próprio `role` para ADMIN / `status`
--   - psychologist_profiles: mudar take_rate, preço fora da faixa, CRP após a
--                            verificação e recebedor_gateway_id (desvio do split)
--   - patient_profiles:      mudar data_nascimento (burlar consentimento de menor)
-- E get_metrics_summary (security definer) ficou executável por anon.
--
-- O front não escreve nessas tabelas: toda escrita passa pela API (service_role),
-- que valida regra de negócio. Então removemos a escrita do cliente por completo
-- e mantemos só a leitura governada por RLS.

do $$
declare t record;
begin
  for t in
    select c.relname
    from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind in ('r', 'p', 'v', 'm')
  loop
    execute format('revoke insert, update, delete, truncate, references, trigger on public.%I from anon, authenticated', t.relname);
  end loop;
end $$;

-- Novas tabelas criadas no futuro também não herdam escrita do cliente.
alter default privileges in schema public revoke insert, update, delete, truncate, references, trigger on tables from anon, authenticated;

-- Policies de UPDATE pelo cliente não têm mais efeito; removê-las evita
-- que um GRANT futuro reabra o buraco silenciosamente.
drop policy if exists users_self_update on users;
drop policy if exists psy_self_update on psychologist_profiles;
drop policy if exists patient_self_update on patient_profiles;

-- Métricas do admin: só a API (service_role) chama.
revoke all on function get_metrics_summary(timestamptz, timestamptz) from public, anon, authenticated;
grant execute on function get_metrics_summary(timestamptz, timestamptz) to service_role;

-- Leads e analytics: nem leitura pelo cliente (dados pessoais / LGPD).
revoke select on public.leads from anon, authenticated;
revoke select on public.analytics_events from anon, authenticated;
