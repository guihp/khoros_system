/**
 * Webhook LiveKit — confirmação cruzada de presença na sala (antifraude):
 * `participant_joined`/`participant_left` verificados por assinatura
 * (WebhookReceiver usa LIVEKIT_API_KEY/SECRET). Não bloqueia o motor de
 * bilhetagem (que já é robusto por heartbeat HMAC) — serve de auditoria e
 * fonte para reforçar a decisão de SUSPENDED/ENDED no futuro.
 *
 * Requer o content-type parser para `application/webhook+json` registrado em app.ts
 * (a verificação de assinatura do LiveKit precisa do corpo bruto, não do JSON já parseado).
 */

import type { FastifyInstance } from "fastify";
import { WebhookReceiver } from "livekit-server-sdk";

export async function registerLiveKitWebhookRoutes(app: FastifyInstance): Promise<void> {
  const receiver = new WebhookReceiver(app.env.LIVEKIT_API_KEY, app.env.LIVEKIT_API_SECRET);

  app.post("/webhooks/livekit", async (req, reply) => {
    const authHeader = req.headers.authorization;
    const rawBody = typeof req.body === "string" ? req.body : JSON.stringify(req.body ?? {});

    try {
      const event = await receiver.receive(rawBody, authHeader);
      req.log.info({ event: event.event, room: event.room?.name, participant: event.participant?.identity }, "webhook livekit");

      if (event.event === "participant_joined" || event.event === "participant_left") {
        await app.supabase.from("audit_log").insert({
          acao: `LIVEKIT_${event.event.toUpperCase()}`,
          entidade: "sessions",
          entidade_id: event.room?.name ?? null,
          metadata: { participant: event.participant?.identity ?? null },
        });
      }
      return reply.code(200).send({ ok: true });
    } catch (err) {
      req.log.warn({ err }, "webhook livekit: assinatura inválida ou payload malformado");
      return reply.code(400).send({ error: "INVALID_WEBHOOK" });
    }
  });
}
