/**
 * Slice 6 (implementado já no Sprint 1 — bloqueante antes de qualquer sessão).
 * Triagem de crise: respostas individuais NUNCA são persistidas (minimização
 * LGPD) — só o desfecho (OK|BLOQUEADO). BLOQUEADO nunca cria/permite sessão.
 */

import type { FastifyInstance } from "fastify";
import { CRISIS_CHANNELS, crisisScreeningSchema, screeningBlocks } from "@khoros/shared";

export async function registerScreeningRoutes(app: FastifyInstance): Promise<void> {
  app.post("/screening", { preHandler: app.requireRole("PATIENT") }, async (req, reply) => {
    if (!req.authUser) return reply.code(401).send({ error: "UNAUTHENTICATED" });

    const parsed = crisisScreeningSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: "VALIDATION", issues: parsed.error.issues });
    }

    const blocked = screeningBlocks(parsed.data);
    const resultado = blocked ? "BLOQUEADO" : "OK";

    const { data, error } = await app.supabase
      .from("crisis_screenings")
      .insert({
        patient_id: req.authUser.id,
        resultado,
        encaminhado_em: blocked ? new Date().toISOString() : null,
      })
      .select("id, resultado, created_at")
      .single();
    if (error || !data) {
      req.log.error({ err: error }, "falha ao registrar triagem de crise");
      return reply.code(500).send({ error: "SCREENING_FAILED" });
    }

    return reply.code(201).send({
      screeningId: data.id,
      resultado: data.resultado,
      ...(blocked
        ? {
            acolhimento: {
              mensagem:
                "Percebemos que você pode estar passando por um momento de risco. Atendimento online não é adequado para emergências. Por favor, busque ajuda imediata pelos canais abaixo.",
              canais: CRISIS_CHANNELS,
            },
          }
        : {}),
    });
  });
}
