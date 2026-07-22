/**
 * Slice 4 — Marketplace mínimo: listagem de psicólogos disponíveis + edição
 * do próprio perfil/disponibilidade. Regra de atendimento (CLAUDE.md):
 * só aparece pra "Falar agora" quem é VERIFIED e está com disponibilidade AVAILABLE.
 */

import type { FastifyInstance } from "fastify";
import {
  AVATAR_MAX_BYTES,
  availabilityUpdateSchema,
  patientProfileUpdateSchema,
  proProfileUpdateSchema,
  psychologistsQuerySchema,
} from "@khoros/shared";
import { getPlatformSettings } from "../../lib/settings.js";
import { countEndedSessions, getAvaliacaoSummary, getCompactStatsBatch } from "../../lib/reviews.js";

const PSY_AVATAR_BUCKET = "psychologist-avatars";
const PATIENT_AVATAR_BUCKET = "patient-avatars";
const AVATAR_MIME_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

const PSY_PUBLIC_SELECT =
  "user_id, bio, abordagens, especialidades, foto_url, preco_por_minuto_centavos, disponibilidade, crp_numero, crp_regiao, users:user_id(full_name)";

const PATIENT_PROFILE_SELECT =
  "cidade, data_nascimento, responsavel_legal_id, foto_url, bio, mostrar_nome_real, camera_ligada_padrao";

export async function registerProfileRoutes(app: FastifyInstance): Promise<void> {
  app.get("/psychologists", { preHandler: app.requireAuth }, async (req, reply) => {
    if (!req.authUser?.registered) return reply.code(403).send({ error: "NOT_REGISTERED" });

    const parsed = psychologistsQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return reply.code(400).send({ error: "VALIDATION", issues: parsed.error.issues });
    }
    const filters = parsed.data;

    let query = app.supabase
      .from("psychologist_profiles")
      .select(PSY_PUBLIC_SELECT)
      .eq("crp_status", "VERIFIED");

    if (filters.disponivel) {
      query = query.eq("disponibilidade", "AVAILABLE");
    }
    if (filters.especialidade) {
      query = query.contains("especialidades", [filters.especialidade]);
    }
    if (filters.abordagem) {
      query = query.contains("abordagens", [filters.abordagem]);
    }
    if (filters.precoMin !== undefined) {
      query = query.gte("preco_por_minuto_centavos", filters.precoMin);
    }
    if (filters.precoMax !== undefined) {
      query = query.lte("preco_por_minuto_centavos", filters.precoMax);
    }

    const { data, error } = await query;
    if (error) return reply.code(500).send({ error: "QUERY_FAILED", message: error.message });

    let items = data ?? [];

    if (filters.q) {
      const needle = filters.q.toLocaleLowerCase("pt-BR");
      items = items.filter((p) => {
        const users = p.users as { full_name: string } | { full_name: string }[] | null;
        const name = Array.isArray(users) ? users[0]?.full_name : users?.full_name;
        return (name ?? "").toLocaleLowerCase("pt-BR").includes(needle);
      });
    }

    const stats = await getCompactStatsBatch(
      app.supabase,
      items.map((p) => p.user_id),
    );
    let withStats = items.map((p) => ({ ...p, ...stats[p.user_id] }));

    if (filters.minNota !== undefined) {
      const minNota = filters.minNota;
      withStats = withStats.filter(
        (p) => p.mediaAvaliacao !== null && p.mediaAvaliacao !== undefined && p.mediaAvaliacao >= minNota,
      );
    }

    return reply.send({ items: withStats });
  });

  app.get<{ Params: { id: string } }>("/psychologists/:id", { preHandler: app.requireAuth }, async (req, reply) => {
    if (!req.authUser?.registered) return reply.code(403).send({ error: "NOT_REGISTERED" });

    const { data, error } = await app.supabase
      .from("psychologist_profiles")
      .select(PSY_PUBLIC_SELECT)
      .eq("user_id", req.params.id)
      .eq("crp_status", "VERIFIED")
      .maybeSingle();
    if (error) return reply.code(500).send({ error: "QUERY_FAILED", message: error.message });
    if (!data) return reply.code(404).send({ error: "NOT_FOUND" });

    const [consultasRealizadas, avaliacao] = await Promise.all([
      countEndedSessions(app.supabase, req.params.id),
      getAvaliacaoSummary(app.supabase, req.params.id),
    ]);

    return reply.send({ ...data, consultasRealizadas, avaliacao });
  });

  app.patch("/pro/availability", { preHandler: app.requireRole("PSYCHOLOGIST") }, async (req, reply) => {
    if (!req.authUser) return reply.code(401).send({ error: "UNAUTHENTICATED" });
    const parsed = availabilityUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: "VALIDATION", issues: parsed.error.issues });
    }

    if (app.sessionRuntime.isPsychologistBusy(req.authUser.id) && parsed.data.disponibilidade === "AVAILABLE") {
      return reply.code(409).send({ error: "IN_SESSION", message: "Não é possível ficar disponível durante uma sessão ativa." });
    }

    const { data, error } = await app.supabase
      .from("psychologist_profiles")
      .update({ disponibilidade: parsed.data.disponibilidade })
      .eq("user_id", req.authUser.id)
      .select("user_id, disponibilidade")
      .maybeSingle();
    if (error) return reply.code(500).send({ error: "UPDATE_FAILED", message: error.message });
    if (!data) return reply.code(404).send({ error: "NOT_FOUND" });
    return reply.send(data);
  });

  app.patch("/pro/profile", { preHandler: app.requireRole("PSYCHOLOGIST") }, async (req, reply) => {
    if (!req.authUser) return reply.code(401).send({ error: "UNAUTHENTICATED" });
    const parsed = proProfileUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: "VALIDATION", issues: parsed.error.issues });
    }
    const patch = parsed.data;

    if (patch.precoPorMinutoCentavos !== undefined) {
      const settings = await getPlatformSettings(app.supabase, [
        "preco_por_minuto_piso_centavos",
        "preco_por_minuto_teto_centavos",
      ]);
      const piso = Number(settings.preco_por_minuto_piso_centavos ?? 0);
      const teto = Number(settings.preco_por_minuto_teto_centavos ?? Number.MAX_SAFE_INTEGER);
      if (patch.precoPorMinutoCentavos < piso || patch.precoPorMinutoCentavos > teto) {
        return reply.code(400).send({
          error: "PRECO_FORA_DA_FAIXA",
          message: `Preço por minuto deve estar entre ${piso} e ${teto} centavos.`,
        });
      }
    }

    const update: Record<string, unknown> = {};
    if (patch.bio !== undefined) update.bio = patch.bio;
    if (patch.abordagens !== undefined) update.abordagens = patch.abordagens;
    if (patch.especialidades !== undefined) update.especialidades = patch.especialidades;
    if (patch.fotoUrl !== undefined) update.foto_url = patch.fotoUrl;
    if (patch.precoPorMinutoCentavos !== undefined) update.preco_por_minuto_centavos = patch.precoPorMinutoCentavos;
    if (patch.recebedorGatewayId !== undefined) update.recebedor_gateway_id = patch.recebedorGatewayId;

    if (Object.keys(update).length === 0) {
      return reply.code(400).send({ error: "EMPTY_UPDATE" });
    }

    const { data, error } = await app.supabase
      .from("psychologist_profiles")
      .update(update)
      .eq("user_id", req.authUser.id)
      .select(
        "user_id, bio, abordagens, especialidades, foto_url, preco_por_minuto_centavos, recebedor_gateway_id, disponibilidade",
      )
      .maybeSingle();
    if (error) return reply.code(500).send({ error: "UPDATE_FAILED", message: error.message });
    if (!data) return reply.code(404).send({ error: "NOT_FOUND" });
    return reply.send(data);
  });

  /**
   * Upload de avatar via service role → Storage público `psychologist-avatars`.
   * Multipart field: `file` (jpeg/png/webp, ≤ 2MB).
   */
  app.post("/pro/avatar", { preHandler: app.requireRole("PSYCHOLOGIST") }, async (req, reply) => {
    if (!req.authUser) return reply.code(401).send({ error: "UNAUTHENTICATED" });

    const file = await req.file();
    if (!file) {
      return reply.code(400).send({ error: "VALIDATION", message: "Envie o arquivo no campo `file`." });
    }

    const ext = AVATAR_MIME_EXT[file.mimetype];
    if (!ext) {
      return reply.code(400).send({
        error: "VALIDATION",
        message: "Formato inválido. Use JPEG, PNG ou WebP.",
      });
    }

    const buffer = await file.toBuffer();
    if (buffer.byteLength > AVATAR_MAX_BYTES) {
      return reply.code(400).send({
        error: "VALIDATION",
        message: "A imagem deve ter no máximo 2 MB.",
      });
    }

    const objectPath = `${req.authUser.id}/avatar.${ext}`;
    const { error: uploadError } = await app.supabase.storage
      .from(PSY_AVATAR_BUCKET)
      .upload(objectPath, buffer, {
        contentType: file.mimetype,
        upsert: true,
        cacheControl: "3600",
      });
    if (uploadError) {
      return reply.code(500).send({ error: "UPLOAD_FAILED", message: uploadError.message });
    }

    const { data: publicUrlData } = app.supabase.storage.from(PSY_AVATAR_BUCKET).getPublicUrl(objectPath);
    // Bust cache após sobrescrever o mesmo path.
    const fotoUrl = `${publicUrlData.publicUrl}?v=${Date.now()}`;

    const { data, error } = await app.supabase
      .from("psychologist_profiles")
      .update({ foto_url: fotoUrl })
      .eq("user_id", req.authUser.id)
      .select("user_id, foto_url")
      .maybeSingle();
    if (error) return reply.code(500).send({ error: "UPDATE_FAILED", message: error.message });
    if (!data) return reply.code(404).send({ error: "NOT_FOUND" });

    return reply.send({ foto_url: data.foto_url });
  });

  /**
   * Upload de avatar via service role → Storage público `patient-avatars`.
   * Multipart field: `file` (jpeg/png/webp, ≤ 2MB).
   */
  app.post("/me/avatar", { preHandler: app.requireRole("PATIENT") }, async (req, reply) => {
    if (!req.authUser) return reply.code(401).send({ error: "UNAUTHENTICATED" });

    const file = await req.file();
    if (!file) {
      return reply.code(400).send({ error: "VALIDATION", message: "Envie o arquivo no campo `file`." });
    }

    const ext = AVATAR_MIME_EXT[file.mimetype];
    if (!ext) {
      return reply.code(400).send({
        error: "VALIDATION",
        message: "Formato inválido. Use JPEG, PNG ou WebP.",
      });
    }

    const buffer = await file.toBuffer();
    if (buffer.byteLength > AVATAR_MAX_BYTES) {
      return reply.code(400).send({
        error: "VALIDATION",
        message: "A imagem deve ter no máximo 2 MB.",
      });
    }

    const objectPath = `${req.authUser.id}/avatar.${ext}`;
    const { error: uploadError } = await app.supabase.storage
      .from(PATIENT_AVATAR_BUCKET)
      .upload(objectPath, buffer, {
        contentType: file.mimetype,
        upsert: true,
        cacheControl: "3600",
      });
    if (uploadError) {
      return reply.code(500).send({ error: "UPLOAD_FAILED", message: uploadError.message });
    }

    const { data: publicUrlData } = app.supabase.storage.from(PATIENT_AVATAR_BUCKET).getPublicUrl(objectPath);
    const fotoUrl = `${publicUrlData.publicUrl}?v=${Date.now()}`;

    const { data, error } = await app.supabase
      .from("patient_profiles")
      .update({ foto_url: fotoUrl })
      .eq("user_id", req.authUser.id)
      .select("user_id, foto_url")
      .maybeSingle();
    if (error) return reply.code(500).send({ error: "UPDATE_FAILED", message: error.message });
    if (!data) return reply.code(404).send({ error: "NOT_FOUND" });

    return reply.send({ foto_url: data.foto_url });
  });

  app.patch("/me/profile", { preHandler: app.requireRole("PATIENT") }, async (req, reply) => {
    if (!req.authUser) return reply.code(401).send({ error: "UNAUTHENTICATED" });
    const parsed = patientProfileUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: "VALIDATION", issues: parsed.error.issues });
    }
    const patch = parsed.data;

    if (patch.fullName !== undefined || patch.nickname !== undefined) {
      const userUpdate: Record<string, unknown> = {};
      if (patch.fullName !== undefined) userUpdate.full_name = patch.fullName;
      if (patch.nickname !== undefined) userUpdate.public_nickname = patch.nickname;
      const { error } = await app.supabase.from("users").update(userUpdate).eq("id", req.authUser.id);
      if (error) return reply.code(500).send({ error: "UPDATE_FAILED", message: error.message });
    }

    const profileUpdate: Record<string, unknown> = {};
    if (patch.city !== undefined) profileUpdate.cidade = patch.city;
    if (patch.bio !== undefined) profileUpdate.bio = patch.bio;
    if (patch.mostrarNomeReal !== undefined) profileUpdate.mostrar_nome_real = patch.mostrarNomeReal;
    if (patch.cameraLigadaPadrao !== undefined) profileUpdate.camera_ligada_padrao = patch.cameraLigadaPadrao;

    if (Object.keys(profileUpdate).length > 0) {
      const { error } = await app.supabase
        .from("patient_profiles")
        .update(profileUpdate)
        .eq("user_id", req.authUser.id);
      if (error) return reply.code(500).send({ error: "UPDATE_FAILED", message: error.message });
    }

    const { data: user, error: userError } = await app.supabase
      .from("users")
      .select("id, role, email, full_name, public_nickname, status, created_at")
      .eq("id", req.authUser.id)
      .single();
    if (userError || !user) return reply.code(500).send({ error: "UPDATE_FAILED" });

    const { data: profile } = await app.supabase
      .from("patient_profiles")
      .select(PATIENT_PROFILE_SELECT)
      .eq("user_id", req.authUser.id)
      .maybeSingle();

    return reply.send({ registered: true, ...user, profile });
  });
}
