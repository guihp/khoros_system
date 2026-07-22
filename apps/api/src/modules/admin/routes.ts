/**
 * Slice 2 — Verificação de CRP pelo admin. Psicólogo só atende com
 * crp_status = VERIFIED (Resolução CFP 09/2024). Toda decisão vai pro audit_log.
 */

import type { FastifyInstance } from "fastify";
import { crpActionSchema } from "@khoros/shared";

export async function registerAdminRoutes(app: FastifyInstance): Promise<void> {
  app.get("/admin/crp/pending", { preHandler: app.requireRole("ADMIN") }, async (_req, reply) => {
    const { data, error } = await app.supabase
      .from("psychologist_profiles")
      .select("user_id, crp_numero, crp_regiao, crp_status, users:user_id(full_name, email, created_at)")
      .eq("crp_status", "PENDING");
    if (error) {
      return reply.code(500).send({ error: "QUERY_FAILED", message: error.message });
    }
    return reply.send({ items: data ?? [] });
  });

  app.post("/admin/crp/:userId/verify", { preHandler: app.requireRole("ADMIN") }, async (req, reply) => {
    if (!req.authUser) return reply.code(401).send({ error: "UNAUTHENTICATED" });
    const { userId } = req.params as { userId: string };

    const { data, error } = await app.supabase
      .from("psychologist_profiles")
      .update({
        crp_status: "VERIFIED",
        verificado_em: new Date().toISOString(),
        verificado_por: req.authUser.id,
      })
      .eq("user_id", userId)
      .select("user_id, crp_status")
      .maybeSingle();
    if (error) return reply.code(500).send({ error: "UPDATE_FAILED", message: error.message });
    if (!data) return reply.code(404).send({ error: "NOT_FOUND" });

    await app.supabase.from("audit_log").insert({
      actor_id: req.authUser.id,
      acao: "CRP_VERIFIED",
      entidade: "psychologist_profiles",
      entidade_id: userId,
      ip: req.ip,
      metadata: {},
    });

    return reply.send(data);
  });

  app.post("/admin/crp/:userId/reject", { preHandler: app.requireRole("ADMIN") }, async (req, reply) => {
    if (!req.authUser) return reply.code(401).send({ error: "UNAUTHENTICATED" });
    const { userId } = req.params as { userId: string };
    const parsed = crpActionSchema.safeParse(req.body ?? {});
    const motivo = parsed.success ? parsed.data.motivo : undefined;

    const { data, error } = await app.supabase
      .from("psychologist_profiles")
      .update({ crp_status: "REJECTED" })
      .eq("user_id", userId)
      .select("user_id, crp_status")
      .maybeSingle();
    if (error) return reply.code(500).send({ error: "UPDATE_FAILED", message: error.message });
    if (!data) return reply.code(404).send({ error: "NOT_FOUND" });

    await app.supabase.from("audit_log").insert({
      actor_id: req.authUser.id,
      acao: "CRP_REJECTED",
      entidade: "psychologist_profiles",
      entidade_id: userId,
      ip: req.ip,
      metadata: motivo ? { motivo } : {},
    });

    return reply.send(data);
  });
}
