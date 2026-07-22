/**
 * Agregados de reputação do psicólogo (slice de marketplace): consultas
 * realizadas (sessions ENDED) e avaliações publicadas (reviews.publicado),
 * sempre com join em `sessions` para garantir que a review pertence a este
 * psicólogo. Sem cache: volume esperado no MVP não justifica a complexidade.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

const REVIEW_ITEMS_LIMIT = 10;

export interface ReviewListItem {
  nota: number;
  comentario: string | null;
  criadoEm: string;
}

export interface AvaliacaoSummary {
  media: number | null;
  total: number;
  itens: ReviewListItem[];
}

function roundToOneDecimal(value: number): number {
  return Math.round(value * 10) / 10;
}

export async function countEndedSessions(supabase: SupabaseClient, psychologistId: string): Promise<number> {
  const { count, error } = await supabase
    .from("sessions")
    .select("id", { count: "exact", head: true })
    .eq("psychologist_id", psychologistId)
    .eq("status", "ENDED");
  if (error) throw error;
  return count ?? 0;
}

/**
 * Busca todas as reviews publicadas do psicólogo (necessário para a média
 * correta) e recorta as mais recentes para exibição no perfil.
 */
export async function getAvaliacaoSummary(
  supabase: SupabaseClient,
  psychologistId: string,
): Promise<AvaliacaoSummary> {
  const { data, error } = await supabase
    .from("reviews")
    .select("nota, comentario, created_at, sessions!inner(psychologist_id)")
    .eq("publicado", true)
    .eq("sessions.psychologist_id", psychologistId)
    .order("created_at", { ascending: false });
  if (error) throw error;

  const rows = (data ?? []) as Array<{ nota: number; comentario: string | null; created_at: string }>;
  const total = rows.length;
  const media = total > 0 ? roundToOneDecimal(rows.reduce((sum, r) => sum + r.nota, 0) / total) : null;

  return {
    media,
    total,
    itens: rows.slice(0, REVIEW_ITEMS_LIMIT).map((r) => ({
      nota: r.nota,
      comentario: r.comentario ?? null,
      criadoEm: r.created_at,
    })),
  };
}

export interface CompactStats {
  consultasRealizadas: number;
  mediaAvaliacao: number | null;
  totalAvaliacoes: number;
}

/** Versão em lote (evita N+1) para badges na listagem `GET /psychologists`. */
export async function getCompactStatsBatch(
  supabase: SupabaseClient,
  psychologistIds: string[],
): Promise<Record<string, CompactStats>> {
  const stats: Record<string, CompactStats> = {};
  for (const id of psychologistIds) {
    stats[id] = { consultasRealizadas: 0, mediaAvaliacao: null, totalAvaliacoes: 0 };
  }
  if (psychologistIds.length === 0) return stats;

  const { data: sessionRows, error: sessionError } = await supabase
    .from("sessions")
    .select("psychologist_id")
    .in("psychologist_id", psychologistIds)
    .eq("status", "ENDED");
  if (sessionError) throw sessionError;
  for (const row of (sessionRows ?? []) as Array<{ psychologist_id: string }>) {
    const s = stats[row.psychologist_id];
    if (s) s.consultasRealizadas += 1;
  }

  const { data: reviewRows, error: reviewError } = await supabase
    .from("reviews")
    .select("nota, sessions!inner(psychologist_id)")
    .eq("publicado", true)
    .in("sessions.psychologist_id", psychologistIds);
  if (reviewError) throw reviewError;

  const sums = new Map<string, { sum: number; count: number }>();
  for (const row of (reviewRows ?? []) as unknown as Array<{
    nota: number;
    sessions: { psychologist_id: string } | { psychologist_id: string }[] | null;
  }>) {
    const psyId = Array.isArray(row.sessions) ? row.sessions[0]?.psychologist_id : row.sessions?.psychologist_id;
    if (!psyId) continue;
    const acc = sums.get(psyId) ?? { sum: 0, count: 0 };
    acc.sum += row.nota;
    acc.count += 1;
    sums.set(psyId, acc);
  }
  for (const [psyId, acc] of sums) {
    const s = stats[psyId];
    if (!s) continue;
    s.totalAvaliacoes = acc.count;
    s.mediaAvaliacao = acc.count > 0 ? roundToOneDecimal(acc.sum / acc.count) : null;
  }

  return stats;
}
