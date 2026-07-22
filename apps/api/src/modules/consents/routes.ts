/**
 * Slice 1 — Consentimentos. Termo de consentimento livre e esclarecido + LGPD
 * antes da 1ª consulta; RESPONSAVEL_LEGAL adicional quando paciente é menor.
 * Versões vêm de `platform_settings` — reaceite obrigatório quando mudam.
 */

import type { FastifyInstance } from "fastify";
import { consentAcceptSchema } from "@khoros/shared";
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

async function isMinorPatient(app: FastifyInstance, userId: string): Promise<boolean> {
  const { data } = await app.supabase
    .from("patient_profiles")
    .select("data_nascimento")
    .eq("user_id", userId)
    .maybeSingle();
  return data ? calculateAge(data.data_nascimento) < 18 : false;
}

export async function registerConsentRoutes(app: FastifyInstance): Promise<void> {
  app.get("/consents/status", { preHandler: app.requireAuth }, async (req, reply) => {
    if (!req.authUser?.registered) return reply.code(403).send({ error: "NOT_REGISTERED" });
    const userId = req.authUser.id;

    const settings = await getPlatformSettings(app.supabase, [
      "versao_termo_consentimento",
      "versao_termo_lgpd",
    ]);
    const versaoTermo = String(settings.versao_termo_consentimento ?? "");
    const versaoLgpd = String(settings.versao_termo_lgpd ?? "");

    const { data: consents } = await app.supabase
      .from("consents")
      .select("tipo, versao, aceito_em")
      .eq("user_id", userId)
      .order("aceito_em", { ascending: false });

    const hasAccepted = (tipo: string, versao: string) =>
      (consents ?? []).some((c) => c.tipo === tipo && c.versao === versao);

    const minor = req.authUser.role === "PATIENT" ? await isMinorPatient(app, userId) : false;

    return reply.send({
      termoOk: hasAccepted("TERMO_CONSENTIMENTO", versaoTermo),
      lgpdOk: hasAccepted("LGPD", versaoLgpd),
      isMinor: minor,
      responsavelLegalOk: minor ? (consents ?? []).some((c) => c.tipo === "RESPONSAVEL_LEGAL") : true,
      versaoTermo,
      versaoLgpd,
    });
  });

  app.post("/consents/accept", { preHandler: app.requireAuth }, async (req, reply) => {
    if (!req.authUser?.registered) return reply.code(403).send({ error: "NOT_REGISTERED" });

    const parsed = consentAcceptSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: "VALIDATION", issues: parsed.error.issues });
    }
    const { tipo, responsavelNome } = parsed.data;

    if (tipo === "RESPONSAVEL_LEGAL" && !responsavelNome) {
      return reply.code(400).send({ error: "RESPONSAVEL_NOME_OBRIGATORIO" });
    }

    const settings = await getPlatformSettings(app.supabase, [
      "versao_termo_consentimento",
      "versao_termo_lgpd",
    ]);
    const versao =
      tipo === "LGPD"
        ? String(settings.versao_termo_lgpd ?? "")
        : tipo === "TERMO_CONSENTIMENTO"
          ? String(settings.versao_termo_consentimento ?? "")
          : "responsavel-legal-v1";

    // NOTA: `consents` não tem coluna para o nome do responsável (schema atual);
    // `responsavelNome` serve hoje como confirmação explícita no fluxo, e o
    // vínculo formal do responsável fica em patient_profiles.responsavel_legal_id
    // (conta própria do responsável) quando esse fluxo completo existir.
    const { data, error } = await app.supabase
      .from("consents")
      .insert({
        user_id: req.authUser.id,
        tipo,
        versao,
        ip: req.ip,
        responsavel_user_id: tipo === "RESPONSAVEL_LEGAL" ? req.authUser.id : null,
      })
      .select("id, tipo, versao, aceito_em")
      .single();
    if (error) {
      req.log.error({ err: error }, "falha ao registrar consentimento");
      return reply.code(500).send({ error: "CONSENT_FAILED" });
    }
    return reply.code(201).send(data);
  });
}
