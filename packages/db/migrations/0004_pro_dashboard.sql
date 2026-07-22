-- KHOROS — Painel do psicólogo (índice + view de agregados)
-- Espelho da migration MCP `pro_dashboard`.

-- Índice para listagem/histórico do painel do psicólogo
create index if not exists sessions_psy_status_ended_idx
  on sessions (psychologist_id, status, ended_at desc);

-- Agregados do painel: sessões ENDED + média de reviews publicadas.
-- security_invoker = true: RLS de sessions/reviews continua valendo.
create or replace view psychologist_dashboard_stats
with (security_invoker = true)
as
with ended as (
  select
    psychologist_id,
    count(*)::bigint as consultas_ended,
    coalesce(sum(segundos_cobrados), 0)::bigint as segundos_totais,
    coalesce(sum(valor_psicologo_centavos), 0)::bigint as ganhos_centavos
  from sessions
  where status = 'ENDED'
  group by psychologist_id
),
review_agg as (
  select
    s.psychologist_id,
    round(avg(r.nota)::numeric, 1) as media_avaliacao,
    count(*)::bigint as total_avaliacoes
  from reviews r
  inner join sessions s on s.id = r.session_id
  where r.publicado = true
  group by s.psychologist_id
)
select
  coalesce(e.psychologist_id, ra.psychologist_id) as psychologist_id,
  coalesce(e.consultas_ended, 0) as consultas_ended,
  coalesce(e.segundos_totais, 0) as segundos_totais,
  coalesce(e.ganhos_centavos, 0) as ganhos_centavos,
  ra.media_avaliacao,
  coalesce(ra.total_avaliacoes, 0) as total_avaliacoes
from ended e
full outer join review_agg ra on ra.psychologist_id = e.psychologist_id;

grant select on psychologist_dashboard_stats to authenticated, anon, service_role;
