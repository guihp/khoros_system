/**
 * Webhook Asaas — confirmação de pagamento Pix. Verificação de assinatura via
 * header `asaas-access-token` (token configurado no painel Asaas = ASAAS_WEBHOOK_TOKEN).
 * Idempotente por natureza: idempotency_key = `recarga:{payment.id}` — reenvio
 * do gateway nunca duplica crédito.
 */

import type { FastifyInstance } from "fastify";

interface AsaasWebhookPayload {
  event: string;
  payment?: {
    id: string;
    value: number;
    externalReference?: string | null;
  };
}

const CONFIRMING_EVENTS = new Set(["PAYMENT_CONFIRMED", "PAYMENT_RECEIVED"]);

export async function registerAsaasWebhookRoutes(app: FastifyInstance): Promise<void> {
  app.post("/webhooks/asaas", async (req, reply) => {
    const token = req.headers["asaas-access-token"];
    if (!token || token !== app.env.ASAAS_WEBHOOK_TOKEN) {
      return reply.code(401).send({ error: "INVALID_WEBHOOK_TOKEN" });
    }

    const payload = req.body as AsaasWebhookPayload;
    if (!CONFIRMING_EVENTS.has(payload.event) || !payload.payment) {
      return reply.code(200).send({ ok: true, ignored: true });
    }

    const { id: paymentId, value, externalReference } = payload.payment;
    if (!externalReference) {
      req.log.warn({ paymentId }, "webhook asaas sem externalReference — não é possível creditar");
      return reply.code(200).send({ ok: true, ignored: true });
    }

    const valorCentavos = Math.round(value * 100);
    const { error } = await app.supabase.from("ledger_entries").insert({
      wallet_id: externalReference,
      tipo: "RECARGA",
      valor_centavos: valorCentavos,
      idempotency_key: `recarga:${paymentId}`,
      metadata: { paymentId, event: payload.event },
    });

    if (error) {
      // 23505 = unique_violation → webhook duplicado (retry do gateway); idempotência OK.
      if ((error as { code?: string }).code === "23505") {
        return reply.code(200).send({ ok: true, duplicate: true });
      }
      req.log.error({ err: error }, "falha ao creditar recarga via webhook Asaas");
      return reply.code(500).send({ error: "LEDGER_INSERT_FAILED" });
    }

    app.sessionRuntime.notifyWalletCredit(externalReference, valorCentavos);

    return reply.code(200).send({ ok: true });
  });
}
