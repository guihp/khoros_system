/**
 * Slice 3 — Carteira e recarga Pix. Saldo é sempre o materializado em
 * `wallets` (mantido por trigger a partir do ledger append-only).
 */

import type { FastifyInstance } from "fastify";
import { topupSchema } from "@khoros/shared";
import { AsaasApiError, AsaasNotConfiguredError, createPixCharge, ensureAsaasCustomer } from "./asaas.js";

export async function registerWalletRoutes(app: FastifyInstance): Promise<void> {
  app.get("/wallet", { preHandler: app.requireAuth }, async (req, reply) => {
    if (!req.authUser?.registered) return reply.code(403).send({ error: "NOT_REGISTERED" });

    const { data, error } = await app.supabase
      .from("wallets")
      .select("saldo_centavos, saldo_reservado_centavos, updated_at")
      .eq("user_id", req.authUser.id)
      .maybeSingle();
    if (error) return reply.code(500).send({ error: "QUERY_FAILED", message: error.message });
    if (!data) return reply.code(404).send({ error: "WALLET_NOT_FOUND" });
    return reply.send(data);
  });

  app.get("/wallet/ledger", { preHandler: app.requireAuth }, async (req, reply) => {
    if (!req.authUser?.registered) return reply.code(403).send({ error: "NOT_REGISTERED" });
    const query = req.query as { limit?: string; offset?: string };
    const limit = Math.min(Number(query.limit ?? 50) || 50, 200);
    const offset = Number(query.offset ?? 0) || 0;

    const { data, error } = await app.supabase
      .from("ledger_entries")
      .select("id, tipo, valor_centavos, session_id, metadata, created_at")
      .eq("wallet_id", req.authUser.id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);
    if (error) return reply.code(500).send({ error: "QUERY_FAILED", message: error.message });
    return reply.send({ items: data ?? [], limit, offset });
  });

  app.post("/wallet/topup", { preHandler: app.requireAuth }, async (req, reply) => {
    if (!req.authUser?.registered) return reply.code(403).send({ error: "NOT_REGISTERED" });

    const parsed = topupSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: "VALIDATION", issues: parsed.error.issues });
    }

    const { data: user } = await app.supabase
      .from("users")
      .select("full_name, email")
      .eq("id", req.authUser.id)
      .single();
    if (!user) return reply.code(404).send({ error: "USER_NOT_FOUND" });

    try {
      const customer = await ensureAsaasCustomer(app.env, {
        userId: req.authUser.id,
        name: user.full_name,
        email: user.email,
        cpfCnpj: parsed.data.cpfCnpj,
      });
      const { charge, qrCode } = await createPixCharge(app.env, {
        customerId: customer.id,
        valueCents: parsed.data.valorCentavos,
        description: "Recarga KHOROS",
        externalReference: req.authUser.id,
      });
      return reply.code(201).send({
        paymentId: charge.id,
        status: charge.status,
        valorCentavos: parsed.data.valorCentavos,
        qrCodeImage: qrCode.encodedImage,
        qrCodePayload: qrCode.payload,
        expirationDate: qrCode.expirationDate,
        invoiceUrl: charge.invoiceUrl,
      });
    } catch (err) {
      if (err instanceof AsaasNotConfiguredError) {
        return reply.code(503).send({
          error: "ASAAS_NOT_CONFIGURED",
          message:
            "Pagamentos Pix ainda não estão configurados neste ambiente (sandbox Asaas pendente). Configure ASAAS_API_KEY para habilitar recargas reais.",
        });
      }
      if (err instanceof AsaasApiError) {
        return reply.code(502).send({ error: "ASAAS_ERROR", message: err.message });
      }
      req.log.error({ err }, "falha inesperada na recarga Pix");
      return reply.code(500).send({ error: "TOPUP_FAILED" });
    }
  });
}
