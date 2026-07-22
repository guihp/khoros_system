/**
 * Painel do psicólogo: KPIs (view psychologist_dashboard_stats), histórico
 * de sessões e resumo de avaliações. Nickname do paciente apenas — nunca
 * e-mail/nome completo; sem dados clínicos.
 */

import type { FastifyInstance } from "fastify";
import { proSessionsQuerySchema } from "@khoros/shared";
import { getAvaliacaoSummary } from "../../lib/reviews.js";

const RECENT_SESSIONS_LIMIT = 5;

const SESSION_HISTORY_SELECT =
  "id, status, created_at, started_at, ended_at, segundos_cobrados, valor_psicologo_centavos, patient:patient_id(public_nickname)";

interface DashboardStatsRow {
  psychologist_id: string;
  consultas_ended: number;
  segundos_totais: number;
  ganhos_centavos: number;
  media_avaliacao: number | string | null;
  total_avaliacoes: number;
}

interface SessionHistoryRow {
  id: string;
  status: string;
  created_at: string;
  started_at: string | null;
  ended_at: string | null;
  segundos_cobrados: number;
  valor_psicologo_centavos: number | null;
  patient: { public_nickname: string | null } | { public_nickname: string | null }[] | null;
}

function patientNickname(
  patient: SessionHistoryRow["patient"],
): string | null {
  if (!patient) return null;
  const row = Array.isArray(patient) ? patient[0] : patient;
  return row?.public_nickname ?? null;
}

function mapSessionHistoryItem(row: SessionHistoryRow) {
  return {
    id: row.id,
    status: row.status,
    createdAt: row.created_at,
    startedAt: row.started_at,
    endedAt: row.ended_at,
    segundosCobrados: row.segundos_cobrados,
    valorPsicologoCentavos: row.valor_psicologo_centavos,
    patientNickname: patientNickname(row.patient),
  };
}

function emptyKpis() {
  return {
    consultasEnded: 0,
    segundosTotais: 0,
    ganhosCentavos: 0,
    mediaAvaliacao: null as number | null,
    totalAvaliacoes: 0,
  };
}

function mapKpis(row: DashboardStatsRow | null) {
  if (!row) return emptyKpis();
  const media =
    row.media_avaliacao === null || row.media_avaliacao === undefined
      ? null
      : Number(row.media_avaliacao);
  return {
    consultasEnded: Number(row.consultas_ended) || 0,
    segundosTotais: Number(row.segundos_totais) || 0,
    ganhosCentavos: Number(row.ganhos_centavos) || 0,
    mediaAvaliacao: media !== null && Number.isFinite(media) ? media : null,
    totalAvaliacoes: Number(row.total_avaliacoes) || 0,
  };
}

export async function registerProRoutes(app: FastifyInstance): Promise<void> {
  app.get("/pro/dashboard", { preHandler: app.requireRole("PSYCHOLOGIST") }, async (req, reply) => {
    if (!req.authUser) return reply.code(401).send({ error: "UNAUTHENTICATED" });
    const psychologistId = req.authUser.id;

    const [statsResult, profileResult, recentResult, avaliacao] = await Promise.all([
      app.supabase
        .from("psychologist_dashboard_stats")
        .select(
          "psychologist_id, consultas_ended, segundos_totais, ganhos_centavos, media_avaliacao, total_avaliacoes",
        )
        .eq("psychologist_id", psychologistId)
        .maybeSingle(),
      app.supabase
        .from("psychologist_profiles")
        .select(
          "crp_numero, crp_regiao, crp_status, bio, abordagens, especialidades, foto_url, preco_por_minuto_centavos, disponibilidade, users:user_id(full_name, public_nickname)",
        )
        .eq("user_id", psychologistId)
        .maybeSingle(),
      app.supabase
        .from("sessions")
        .select(SESSION_HISTORY_SELECT)
        .eq("psychologist_id", psychologistId)
        .order("ended_at", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false })
        .limit(RECENT_SESSIONS_LIMIT),
      getAvaliacaoSummary(app.supabase, psychologistId),
    ]);

    if (statsResult.error) {
      return reply.code(500).send({ error: "QUERY_FAILED", message: statsResult.error.message });
    }
    if (profileResult.error) {
      return reply.code(500).send({ error: "QUERY_FAILED", message: profileResult.error.message });
    }
    if (recentResult.error) {
      return reply.code(500).send({ error: "QUERY_FAILED", message: recentResult.error.message });
    }
    if (!profileResult.data) {
      return reply.code(404).send({ error: "NOT_FOUND", message: "Perfil profissional não encontrado." });
    }

    const profile = profileResult.data as {
      crp_numero: string;
      crp_regiao: string;
      crp_status: string;
      bio: string | null;
      abordagens: string[] | null;
      especialidades: string[] | null;
      foto_url: string | null;
      preco_por_minuto_centavos: number;
      disponibilidade: string;
      users:
        | { full_name: string; public_nickname: string | null }
        | { full_name: string; public_nickname: string | null }[]
        | null;
    };

    const userRow = Array.isArray(profile.users) ? profile.users[0] : profile.users;

    return reply.send({
      kpis: mapKpis(statsResult.data as DashboardStatsRow | null),
      recentSessions: ((recentResult.data ?? []) as SessionHistoryRow[]).map(mapSessionHistoryItem),
      avaliacao,
      profile: {
        fullName: userRow?.full_name ?? null,
        publicNickname: userRow?.public_nickname ?? null,
        crpNumero: profile.crp_numero,
        crpRegiao: profile.crp_regiao,
        crpStatus: profile.crp_status,
        bio: profile.bio,
        abordagens: profile.abordagens,
        especialidades: profile.especialidades,
        fotoUrl: profile.foto_url,
        precoPorMinutoCentavos: profile.preco_por_minuto_centavos,
        disponibilidade: profile.disponibilidade,
      },
    });
  });

  app.get("/pro/sessions", { preHandler: app.requireRole("PSYCHOLOGIST") }, async (req, reply) => {
    if (!req.authUser) return reply.code(401).send({ error: "UNAUTHENTICATED" });
    const parsed = proSessionsQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return reply.code(400).send({ error: "VALIDATION", issues: parsed.error.issues });
    }
    const { limit } = parsed.data;

    const { data, error } = await app.supabase
      .from("sessions")
      .select(SESSION_HISTORY_SELECT)
      .eq("psychologist_id", req.authUser.id)
      .order("ended_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) return reply.code(500).send({ error: "QUERY_FAILED", message: error.message });

    return reply.send({
      items: ((data ?? []) as SessionHistoryRow[]).map(mapSessionHistoryItem),
      limit,
    });
  });
}
