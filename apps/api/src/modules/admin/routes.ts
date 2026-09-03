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

  app.get("/admin/leads", { preHandler: app.requireRole("ADMIN") }, async (req, reply) => {
    const query = req.query as { source?: string; limit?: string; offset?: string };
    const limit = Math.min(Number(query.limit ?? 50) || 50, 200);
    const offset = Number(query.offset ?? 0) || 0;

    let dbQuery = app.supabase
      .from("leads")
      .select(
        "id, name, email, phone, city, article_slug, article_category, article_title, source, created_at",
        { count: "exact" },
      )
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (query.source === "waitlist" || query.source === "article") {
      dbQuery = dbQuery.eq("source", query.source);
    }

    const { data, error, count } = await dbQuery;
    if (error) {
      return reply.code(500).send({ error: "QUERY_FAILED", message: error.message });
    }

    return reply.send({ items: data ?? [], total: count ?? 0, limit, offset });
  });

  app.get("/admin/metrics/summary", { preHandler: app.requireRole("ADMIN") }, async (req, reply) => {
    const query = req.query as { from?: string; to?: string };
    const now = new Date();
    const to = query.to ? new Date(query.to) : now;
    const from = query.from
      ? new Date(query.from)
      : new Date(to.getTime() - 30 * 24 * 60 * 60 * 1000);

    if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
      return reply.code(400).send({ error: "INVALID_RANGE", message: "from/to devem ser ISO dates" });
    }
    if (from >= to) {
      return reply.code(400).send({ error: "INVALID_RANGE", message: "from deve ser anterior a to" });
    }

    const { data, error } = await app.supabase.rpc("get_metrics_summary", {
      from_ts: from.toISOString(),
      to_ts: to.toISOString(),
    });

    if (error) {
      return reply.code(500).send({ error: "QUERY_FAILED", message: error.message });
    }

    const summary = (data ?? {}) as Record<string, unknown>;
    return reply.send({
      from: from.toISOString(),
      to: to.toISOString(),
      pageviews: Number(summary.pageviews ?? 0),
      unique_visitors: Number(summary.unique_visitors ?? 0),
      unique_sessions: Number(summary.unique_sessions ?? 0),
      leads_count: Number(summary.leads_count ?? 0),
      funnel: (summary.funnel as Record<string, number>) ?? {},
      top_paths: (summary.top_paths as { path: string; count: number }[]) ?? [],
      top_referrers: (summary.top_referrers as { referrer: string; count: number }[]) ?? [],
      top_utm_sources: (summary.top_utm_sources as { utm_source: string; count: number }[]) ?? [],
      top_utm_campaigns:
        (summary.top_utm_campaigns as { utm_campaign: string; count: number }[]) ?? [],
      devices: (summary.devices as { device_type: string; count: number }[]) ?? [],
      daily: (summary.daily as { day: string; pageviews: number; visitors: number }[]) ?? [],
    });
  });

  app.get("/admin/metrics/events", { preHandler: app.requireRole("ADMIN") }, async (req, reply) => {
    const query = req.query as { limit?: string; offset?: string; event?: string };
    const limit = Math.min(Number(query.limit ?? 50) || 50, 200);
    const offset = Number(query.offset ?? 0) || 0;

    let dbQuery = app.supabase
      .from("analytics_events")
      .select(
        "id, event_name, path, referrer, utm_source, utm_medium, utm_campaign, visitor_id, session_id, device_type, article_slug, article_category, created_at",
        { count: "exact" },
      )
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (query.event) {
      dbQuery = dbQuery.eq("event_name", query.event);
    }

    const { data, error, count } = await dbQuery;
    if (error) {
      return reply.code(500).send({ error: "QUERY_FAILED", message: error.message });
    }

    return reply.send({ items: data ?? [], total: count ?? 0, limit, offset });
  });
}
