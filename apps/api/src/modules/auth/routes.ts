/**
 * Slice 1 — Cadastro. O usuário já existe em `auth.users` (criado pelo client
 * Supabase); aqui completamos o perfil de domínio: users + patient/psychologist
 * profile + wallet (paciente). ADMIN só via bootstrap por e-mail (env var).
 */

import type { FastifyInstance } from "fastify";
import { registerSchema } from "@khoros/shared";
import { getPlatformSettings } from "../../lib/settings.js";

function calculateAge(birthDateISO: string, nowMs = Date.now()): number {
  const birth = new Date(birthDateISO);
  const now = new Date(nowMs);
  let age = now.getUTCFullYear() - birth.getUTCFullYear();
  const monthDiff = now.getUTCMonth() - birth.getUTCMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getUTCDate() < birth.getUTCDate())) {
    age -= 1;
  }
  return age;
}

export async function registerAuthRoutes(app: FastifyInstance): Promise<void> {
  app.post("/auth/register", { preHandler: app.requireAuth }, async (req, reply) => {
    if (!req.authUser) return reply.code(401).send({ error: "UNAUTHENTICATED" });

    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: "VALIDATION", issues: parsed.error.issues });
    }
    const body = parsed.data;

    const { data: existing } = await app.supabase
      .from("users")
      .select("id")
      .eq("id", req.authUser.id)
      .maybeSingle();
    if (existing) {
      return reply.code(409).send({ error: "ALREADY_REGISTERED", message: "Usuário já cadastrado." });
    }

    if (body.role === "ADMIN") {
      const bootstrapEmail = app.env.BOOTSTRAP_ADMIN_EMAIL;
      if (!bootstrapEmail || bootstrapEmail.toLowerCase() !== req.authUser.email.toLowerCase()) {
        return reply.code(403).send({
          error: "ADMIN_BOOTSTRAP_ONLY",
          message: "Cadastro como ADMIN só é permitido para o e-mail configurado em BOOTSTRAP_ADMIN_EMAIL.",
        });
      }
    }

    const { error: userError } = await app.supabase.from("users").insert({
      id: req.authUser.id,
      role: body.role,
      email: req.authUser.email,
      full_name: body.fullName,
      public_nickname: body.nickname ?? null,
    });
    if (userError) {
      req.log.error({ err: userError }, "falha ao criar users");
      return reply.code(500).send({ error: "REGISTER_FAILED" });
    }

    if (body.role === "PATIENT") {
      // birthDate é obrigatório para PATIENT (garantido pelo schema via superRefine).
      const { error: profileError } = await app.supabase.from("patient_profiles").insert({
        user_id: req.authUser.id,
        cidade: body.city ?? null,
        data_nascimento: body.birthDate,
      });
      if (profileError) {
        req.log.error({ err: profileError }, "falha ao criar patient_profiles");
        return reply.code(500).send({ error: "REGISTER_FAILED" });
      }
      const { error: walletError } = await app.supabase.from("wallets").insert({
        user_id: req.authUser.id,
        saldo_centavos: 0,
        saldo_reservado_centavos: 0,
      });
      if (walletError) {
        req.log.error({ err: walletError }, "falha ao criar wallet");
        return reply.code(500).send({ error: "REGISTER_FAILED" });
      }
    } else if (body.role === "PSYCHOLOGIST") {
      const settings = await getPlatformSettings(app.supabase, [
        "preco_por_minuto_piso_centavos",
        "preco_por_minuto_teto_centavos",
      ]);
      const piso = Number(settings.preco_por_minuto_piso_centavos ?? 0);
      const teto = Number(settings.preco_por_minuto_teto_centavos ?? Number.MAX_SAFE_INTEGER);
      const preco = body.precoPorMinutoCentavos as number;
      if (preco < piso || preco > teto) {
        await app.supabase.from("users").delete().eq("id", req.authUser.id);
        return reply.code(400).send({
          error: "PRECO_FORA_DA_FAIXA",
          message: `Preço por minuto deve estar entre ${piso} e ${teto} centavos.`,
        });
      }
      const { error: profileError } = await app.supabase.from("psychologist_profiles").insert({
        user_id: req.authUser.id,
        crp_numero: body.crpNumero,
        crp_regiao: body.crpRegiao,
        preco_por_minuto_centavos: preco,
        disponibilidade: "OFFLINE",
      });
      if (profileError) {
        req.log.error({ err: profileError }, "falha ao criar psychologist_profiles");
        return reply.code(500).send({ error: "REGISTER_FAILED", message: profileError.message });
      }
    }

    return reply.code(201).send({ id: req.authUser.id, role: body.role });
  });

  app.get("/me", { preHandler: app.requireAuth }, async (req, reply) => {
    if (!req.authUser) return reply.code(401).send({ error: "UNAUTHENTICATED" });
    if (!req.authUser.registered) {
      return reply.code(200).send({ registered: false, email: req.authUser.email });
    }

    const { data: user, error } = await app.supabase
      .from("users")
      .select("id, role, email, full_name, public_nickname, status, created_at")
      .eq("id", req.authUser.id)
      .single();
    if (error || !user) {
      return reply.code(404).send({ error: "NOT_FOUND" });
    }

    if (user.role === "PATIENT") {
      const { data: profile } = await app.supabase
        .from("patient_profiles")
        .select(
          "cidade, data_nascimento, responsavel_legal_id, foto_url, bio, mostrar_nome_real, camera_ligada_padrao",
        )
        .eq("user_id", req.authUser.id)
        .maybeSingle();
      const isMinor = profile ? calculateAge(profile.data_nascimento) < 18 : false;
      return reply.send({ registered: true, ...user, profile, isMinor });
    }

    if (user.role === "PSYCHOLOGIST") {
      const { data: profile } = await app.supabase
        .from("psychologist_profiles")
        .select(
          "crp_numero, crp_regiao, crp_status, bio, abordagens, especialidades, foto_url, preco_por_minuto_centavos, take_rate, recebedor_gateway_id, disponibilidade",
        )
        .eq("user_id", req.authUser.id)
        .maybeSingle();
      return reply.send({ registered: true, ...user, profile });
    }

    return reply.send({ registered: true, ...user });
  });
}
