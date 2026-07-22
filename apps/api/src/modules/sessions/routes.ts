/**
 * Slice 4/5 — HTTP da sessão. A lógica pesada (validações, motor, ledger,
 * LiveKit, lock) vive em SessionRuntime; aqui só roteamento e mapeamento de erro.
 */

import type { FastifyInstance } from "fastify";
import { reviewSubmitSchema, startSessionSchema } from "@khoros/shared";

export async function registerSessionRoutes(app: FastifyInstance): Promise<void> {
  app.post("/sessions/start", { preHandler: app.requireRole("PATIENT") }, async (req, reply) => {
    if (!req.authUser) return reply.code(401).send({ error: "UNAUTHENTICATED" });
    const parsed = startSessionSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: "VALIDATION", issues: parsed.error.issues });
    }

    const result = await app.sessionRuntime.startSession({
      patientId: req.authUser.id,
      psychologistId: parsed.data.psychologistId,
      screeningId: parsed.data.screeningId,
      ip: req.ip,
    });
    if (!result.ok) {
      return reply.code(result.status).send({ error: result.code, message: result.message });
    }
    const { ok, ...body } = result;
    return reply.code(201).send(body);
  });

  app.post("/sessions/:id/accept", { preHandler: app.requireRole("PSYCHOLOGIST") }, async (req, reply) => {
    if (!req.authUser) return reply.code(401).send({ error: "UNAUTHENTICATED" });
    const { id } = req.params as { id: string };
    const result = await app.sessionRuntime.acceptSession(id, req.authUser.id);
    if (!result.ok) return reply.code(result.status).send({ error: result.code, message: result.message });
    const { ok, ...body } = result;
    return reply.send(body);
  });

  app.post("/sessions/:id/decline", { preHandler: app.requireRole("PSYCHOLOGIST") }, async (req, reply) => {
    if (!req.authUser) return reply.code(401).send({ error: "UNAUTHENTICATED" });
    const { id } = req.params as { id: string };
    const result = await app.sessionRuntime.declineSession(id, req.authUser.id);
    if (!result.ok) return reply.code(result.status).send({ error: result.code, message: result.message });
    return reply.send({ ok: true });
  });

  app.post("/sessions/:id/end", { preHandler: app.requireAuth }, async (req, reply) => {
    if (!req.authUser?.registered) return reply.code(403).send({ error: "NOT_REGISTERED" });
    const { id } = req.params as { id: string };
    const result = await app.sessionRuntime.endSession(id, req.authUser.id);
    if (!result.ok) return reply.code(result.status).send({ error: result.code, message: result.message });
    return reply.send({ ok: true });
  });

  app.get("/sessions/:id", { preHandler: app.requireAuth }, async (req, reply) => {
    if (!req.authUser?.registered) return reply.code(403).send({ error: "NOT_REGISTERED" });
    const { id } = req.params as { id: string };

    const { data, error } = await app.supabase
      .from("sessions")
      .select(
        "id, patient_id, psychologist_id, status, created_at, started_at, ended_at, segundos_cobrados, preco_por_minuto_snapshot, valor_total_centavos, valor_psicologo_centavos, valor_plataforma_centavos, livekit_room, motivo_encerramento",
      )
      .eq("id", id)
      .maybeSingle();
    if (error) return reply.code(500).send({ error: "QUERY_FAILED", message: error.message });
    if (!data) return reply.code(404).send({ error: "NOT_FOUND" });

    const isParticipant = data.patient_id === req.authUser.id || data.psychologist_id === req.authUser.id;
    if (!isParticipant && req.authUser.role !== "ADMIN") {
      return reply.code(403).send({ error: "FORBIDDEN" });
    }

    const credentials = await app.sessionRuntime.getParticipantCredentials(id, req.authUser.id);
    return reply.send({
      ...data,
      ...(credentials ?? {}),
      livekitUrl: credentials ? app.env.LIVEKIT_URL : undefined,
    });
  });

  /** Avaliação do paciente sobre uma consulta ENDED — uma por sessão. */
  app.post("/sessions/:id/review", { preHandler: app.requireRole("PATIENT") }, async (req, reply) => {
    if (!req.authUser) return reply.code(401).send({ error: "UNAUTHENTICATED" });
    const { id } = req.params as { id: string };
    const parsed = reviewSubmitSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: "VALIDATION", issues: parsed.error.issues });
    }

    const { data: session, error: sessionError } = await app.supabase
      .from("sessions")
      .select("id, patient_id, status")
      .eq("id", id)
      .maybeSingle();
    if (sessionError) return reply.code(500).send({ error: "QUERY_FAILED", message: sessionError.message });
    if (!session) return reply.code(404).send({ error: "NOT_FOUND" });
    if (session.patient_id !== req.authUser.id) {
      return reply.code(403).send({ error: "FORBIDDEN", message: "Só o paciente desta consulta pode avaliá-la." });
    }
    if (session.status !== "ENDED") {
      return reply.code(409).send({ error: "SESSION_NOT_ENDED", message: "Só é possível avaliar consultas encerradas." });
    }

    const { data: existing } = await app.supabase.from("reviews").select("session_id").eq("session_id", id).maybeSingle();
    if (existing) {
      return reply.code(409).send({ error: "ALREADY_REVIEWED", message: "Esta consulta já foi avaliada." });
    }

    const { data, error } = await app.supabase
      .from("reviews")
      .insert({
        session_id: id,
        nota: parsed.data.nota,
        comentario: parsed.data.comentario ?? null,
        publicado: true,
      })
      .select("session_id, nota, comentario, publicado, created_at")
      .single();
    if (error) {
      if ((error as { code?: string }).code === "23505") {
        return reply.code(409).send({ error: "ALREADY_REVIEWED", message: "Esta consulta já foi avaliada." });
      }
      return reply.code(500).send({ error: "INSERT_FAILED", message: error.message });
    }

    return reply.code(201).send({
      sessionId: data.session_id,
      nota: data.nota,
      comentario: data.comentario,
      publicado: data.publicado,
      criadoEm: data.created_at,
    });
  });

  /** Estado da avaliação de uma sessão — usado pela sala pós-consulta para saber se já foi avaliada. */
  app.get("/sessions/:id/review", { preHandler: app.requireAuth }, async (req, reply) => {
    if (!req.authUser?.registered) return reply.code(403).send({ error: "NOT_REGISTERED" });
    const { id } = req.params as { id: string };

    const { data: session, error: sessionError } = await app.supabase
      .from("sessions")
      .select("id, patient_id, psychologist_id")
      .eq("id", id)
      .maybeSingle();
    if (sessionError) return reply.code(500).send({ error: "QUERY_FAILED", message: sessionError.message });
    if (!session) return reply.code(404).send({ error: "NOT_FOUND" });
    const isParticipant = session.patient_id === req.authUser.id || session.psychologist_id === req.authUser.id;
    if (!isParticipant && req.authUser.role !== "ADMIN") {
      return reply.code(403).send({ error: "FORBIDDEN" });
    }

    const { data, error } = await app.supabase
      .from("reviews")
      .select("session_id, nota, comentario, publicado, created_at")
      .eq("session_id", id)
      .maybeSingle();
    if (error) return reply.code(500).send({ error: "QUERY_FAILED", message: error.message });

    if (!data) return reply.send({ review: null });
    return reply.send({
      review: {
        sessionId: data.session_id,
        nota: data.nota,
        comentario: data.comentario,
        publicado: data.publicado,
        criadoEm: data.created_at,
      },
    });
  });
}
