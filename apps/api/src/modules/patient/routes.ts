/**
 * Painel do paciente: KPIs (sessões ENDED), histórico, avaliações dadas e
 * saldo da carteira. Espelha o padrão de `modules/pro/routes.ts`.
 */

import type { FastifyInstance } from "fastify";
import { patientSessionsQuerySchema } from "@khoros/shared";

const RECENT_SESSIONS_LIMIT = 5;
const RECENT_REVIEWS_LIMIT = 10;

// Explicit FK hints: sessions→users has patient_id + psychologist_id; users↔psychologist_profiles
// has user_id + verificado_por — PostgREST needs disambiguation for nested embeds.
const SESSION_HISTORY_SELECT =
  "id, status, created_at, started_at, ended_at, segundos_cobrados, valor_total_centavos, psychologist:users!sessions_psychologist_id_fkey(full_name, psychologist_profiles!psychologist_profiles_user_id_fkey(crp_numero, crp_regiao, foto_url))";

interface PsyProfileEmbed {
  crp_numero: string;
  crp_regiao: string;
  foto_url: string | null;
}

interface SessionHistoryRow {
  id: string;
  status: string;
  created_at: string;
  started_at: string | null;
  ended_at: string | null;
  segundos_cobrados: number;
  valor_total_centavos: number | null;
  psychologist:
    | {
        full_name: string;
        psychologist_profiles: PsyProfileEmbed | PsyProfileEmbed[] | null;
      }
    | {
        full_name: string;
        psychologist_profiles: PsyProfileEmbed | PsyProfileEmbed[] | null;
      }[]
    | null;
}

interface PatientReviewRow {
  nota: number;
  comentario: string | null;
  created_at: string;
  publicado: boolean;
  sessions:
    | {
        psychologist_id: string;
        psychologist: { full_name: string } | { full_name: string }[] | null;
      }
    | {
        psychologist_id: string;
        psychologist: { full_name: string } | { full_name: string }[] | null;
      }[]
    | null;
}

function one<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function mapSessionHistoryItem(row: SessionHistoryRow) {
  const psy = one(row.psychologist);
  const profile = one(psy?.psychologist_profiles ?? null);
  return {
    id: row.id,
    status: row.status,
    createdAt: row.created_at,
    startedAt: row.started_at,
    endedAt: row.ended_at,
    segundosCobrados: row.segundos_cobrados,
    valorTotalCentavos: row.valor_total_centavos,
    psychologistName: psy?.full_name ?? null,
    crpNumero: profile?.crp_numero ?? null,
    crpRegiao: profile?.crp_regiao ?? null,
    psychologistFotoUrl: profile?.foto_url ?? null,
  };
}

function mapPatientReview(row: PatientReviewRow) {
  const session = one(row.sessions);
  const psy = one(session?.psychologist ?? null);
  return {
    nota: row.nota,
    comentario: row.comentario,
    criadoEm: row.created_at,
    publicado: row.publicado,
    psychologistName: psy?.full_name ?? null,
  };
}

export async function registerPatientRoutes(app: FastifyInstance): Promise<void> {
  app.get("/me/dashboard", { preHandler: app.requireRole("PATIENT") }, async (req, reply) => {
    if (!req.authUser) return reply.code(401).send({ error: "UNAUTHENTICATED" });
    const patientId = req.authUser.id;

    const [endedResult, walletResult, profileResult, recentResult, reviewsResult] = await Promise.all([
      app.supabase
        .from("sessions")
        .select("segundos_cobrados, valor_total_centavos")
        .eq("patient_id", patientId)
        .eq("status", "ENDED"),
      app.supabase
        .from("wallets")
        .select("saldo_centavos, saldo_reservado_centavos")
        .eq("user_id", patientId)
        .maybeSingle(),
      app.supabase
        .from("patient_profiles")
        .select(
          "cidade, data_nascimento, foto_url, bio, mostrar_nome_real, camera_ligada_padrao, users:user_id(full_name, public_nickname)",
        )
        .eq("user_id", patientId)
        .maybeSingle(),
      app.supabase
        .from("sessions")
        .select(SESSION_HISTORY_SELECT)
        .eq("patient_id", patientId)
        .order("ended_at", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false })
        .limit(RECENT_SESSIONS_LIMIT),
      app.supabase
        .from("reviews")
        .select(
          "nota, comentario, created_at, publicado, sessions!inner(patient_id, psychologist_id, psychologist:users!sessions_psychologist_id_fkey(full_name))",
        )
        .eq("sessions.patient_id", patientId)
        .order("created_at", { ascending: false })
        .limit(RECENT_REVIEWS_LIMIT),
    ]);

    if (endedResult.error) {
      return reply.code(500).send({ error: "QUERY_FAILED", message: endedResult.error.message });
    }
    if (walletResult.error) {
      return reply.code(500).send({ error: "QUERY_FAILED", message: walletResult.error.message });
    }
    if (profileResult.error) {
      return reply.code(500).send({ error: "QUERY_FAILED", message: profileResult.error.message });
    }
    if (recentResult.error) {
      return reply.code(500).send({ error: "QUERY_FAILED", message: recentResult.error.message });
    }
    if (reviewsResult.error) {
      return reply.code(500).send({ error: "QUERY_FAILED", message: reviewsResult.error.message });
    }
    if (!profileResult.data) {
      return reply.code(404).send({ error: "NOT_FOUND", message: "Perfil de paciente não encontrado." });
    }

    const endedRows = (endedResult.data ?? []) as Array<{
      segundos_cobrados: number;
      valor_total_centavos: number | null;
    }>;
    const consultasEnded = endedRows.length;
    const segundosTotais = endedRows.reduce((sum, r) => sum + (r.segundos_cobrados || 0), 0);
    const gastoTotalCentavos = endedRows.reduce((sum, r) => sum + (r.valor_total_centavos || 0), 0);

    const profile = profileResult.data as {
      cidade: string | null;
      data_nascimento: string;
      foto_url: string | null;
      bio: string | null;
      mostrar_nome_real: boolean;
      camera_ligada_padrao: boolean;
      users:
        | { full_name: string; public_nickname: string | null }
        | { full_name: string; public_nickname: string | null }[]
        | null;
    };
    const userRow = one(profile.users);

    return reply.send({
      kpis: {
        consultasEnded,
        segundosTotais,
        gastoTotalCentavos,
        saldoCentavos: Number(walletResult.data?.saldo_centavos ?? 0),
        saldoReservadoCentavos: Number(walletResult.data?.saldo_reservado_centavos ?? 0),
      },
      recentSessions: ((recentResult.data ?? []) as SessionHistoryRow[]).map(mapSessionHistoryItem),
      reviews: ((reviewsResult.data ?? []) as PatientReviewRow[]).map(mapPatientReview),
      profile: {
        fullName: userRow?.full_name ?? null,
        publicNickname: userRow?.public_nickname ?? null,
        cidade: profile.cidade,
        dataNascimento: profile.data_nascimento,
        fotoUrl: profile.foto_url,
        bio: profile.bio,
        mostrarNomeReal: profile.mostrar_nome_real,
        cameraLigadaPadrao: profile.camera_ligada_padrao,
      },
    });
  });

  app.get("/me/sessions", { preHandler: app.requireRole("PATIENT") }, async (req, reply) => {
    if (!req.authUser) return reply.code(401).send({ error: "UNAUTHENTICATED" });
    const parsed = patientSessionsQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return reply.code(400).send({ error: "VALIDATION", issues: parsed.error.issues });
    }
    const { limit } = parsed.data;

    const { data, error } = await app.supabase
      .from("sessions")
      .select(SESSION_HISTORY_SELECT)
      .eq("patient_id", req.authUser.id)
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
