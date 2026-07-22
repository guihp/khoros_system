import { z } from "zod";
import { BIO_MAX_LENGTH, TOPUP_MAX_CENTS, TOPUP_MIN_CENTS } from "./constants.js";

/** Validações de entrada compartilhadas (API valida sempre; web usa para UX). */

export const crpSchema = z.object({
  crpNumero: z.string().regex(/^\d{4,7}$/, "Número de CRP inválido"),
  crpRegiao: z.string().regex(/^\d{2}$/, "Região do CRP inválida (ex.: 06)"),
});

export const topupSchema = z.object({
  valorCentavos: z
    .number()
    .int()
    .min(TOPUP_MIN_CENTS, "Recarga mínima de R$ 10,00")
    .max(TOPUP_MAX_CENTS, "Recarga máxima de R$ 2.000,00"),
  /** Exigido pelo gateway (Asaas) para criar o cliente/cobrança Pix na 1ª recarga. */
  cpfCnpj: z
    .string()
    .regex(/^\d{11}$|^\d{14}$/, "CPF/CNPJ inválido")
    .optional(),
});

export const startSessionSchema = z.object({
  psychologistId: z.string().uuid(),
  /** Id da triagem de crise aprovada para ESTA tentativa. */
  screeningId: z.string().uuid(),
});

export const heartbeatSchema = z.object({
  type: z.literal("heartbeat"),
  sessionId: z.string().uuid(),
  seq: z.number().int().nonnegative(),
  hmac: z.string().regex(/^[0-9a-f]{64}$/),
});

/**
 * Triagem de crise: respostas booleanas. QUALQUER "true" bloqueia a consulta.
 * As respostas individuais NÃO são persistidas (minimização LGPD) — só o desfecho.
 */
export const crisisScreeningSchema = z.object({
  riscoDeVida: z.boolean(),
  ideacaoSuicida: z.boolean(),
  situacaoDeViolencia: z.boolean(),
  emergenciaMedica: z.boolean(),
});

export type CrisisScreeningAnswers = z.infer<typeof crisisScreeningSchema>;

export function screeningBlocks(answers: CrisisScreeningAnswers): boolean {
  return Object.values(answers).some(Boolean);
}

/**
 * Cadastro (POST /auth/register). O usuário já existe em auth.users (Supabase) —
 * aqui só completamos o perfil de domínio. Campos condicionais por role.
 */
export const registerSchema = z
  .object({
    role: z.enum(["PATIENT", "PSYCHOLOGIST", "ADMIN"]),
    fullName: z.string().min(2, "Nome completo obrigatório"),
    nickname: z.string().min(2).max(40).optional(),
    birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data de nascimento inválida (AAAA-MM-DD)").optional(),
    city: z.string().max(80).optional(),
    crpNumero: z.string().regex(/^\d{4,7}$/, "Número de CRP inválido").optional(),
    crpRegiao: z.string().regex(/^\d{2}$/, "Região do CRP inválida (ex.: 06)").optional(),
    precoPorMinutoCentavos: z.number().int().positive().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.role === "PATIENT" && !data.birthDate) {
      ctx.addIssue({ code: "custom", message: "birthDate é obrigatório para paciente", path: ["birthDate"] });
    }
    if (data.role === "PSYCHOLOGIST") {
      if (!data.crpNumero) {
        ctx.addIssue({ code: "custom", message: "crpNumero é obrigatório", path: ["crpNumero"] });
      }
      if (!data.crpRegiao) {
        ctx.addIssue({ code: "custom", message: "crpRegiao é obrigatório", path: ["crpRegiao"] });
      }
      if (!data.precoPorMinutoCentavos) {
        ctx.addIssue({
          code: "custom",
          message: "precoPorMinutoCentavos é obrigatório",
          path: ["precoPorMinutoCentavos"],
        });
      }
    }
  });

export const consentAcceptSchema = z.object({
  tipo: z.enum(["TERMO_CONSENTIMENTO", "LGPD", "RESPONSAVEL_LEGAL"]),
  /** Nome de quem assina, exigido apenas para RESPONSAVEL_LEGAL. */
  responsavelNome: z.string().min(2).optional(),
});

export const availabilityUpdateSchema = z.object({
  disponibilidade: z.enum(["AVAILABLE", "OFFLINE"]),
});

export const proProfileUpdateSchema = z.object({
  bio: z.string().max(BIO_MAX_LENGTH, `Bio com no máximo ${BIO_MAX_LENGTH} caracteres`).optional(),
  abordagens: z.array(z.string().min(1).max(60)).max(20).optional(),
  especialidades: z.array(z.string().min(1).max(60)).max(20).optional(),
  fotoUrl: z.string().url().optional(),
  precoPorMinutoCentavos: z.number().int().positive().optional(),
  recebedorGatewayId: z.string().min(1).optional(),
});

export const crpActionSchema = z.object({
  motivo: z.string().max(500).optional(),
});

/** PATCH /me/profile — edição de perfil pelo próprio paciente. */
export const patientProfileUpdateSchema = z
  .object({
    fullName: z.string().min(2).max(120).optional(),
    nickname: z.string().min(2).max(40).optional(),
    city: z.string().max(80).optional(),
    bio: z.string().max(BIO_MAX_LENGTH, `Bio com no máximo ${BIO_MAX_LENGTH} caracteres`).optional(),
    mostrarNomeReal: z.boolean().optional(),
    cameraLigadaPadrao: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Informe pelo menos um campo para atualizar.",
  });

/** POST /sessions/:id/review — avaliação do paciente após consulta ENDED. */
export const reviewSubmitSchema = z.object({
  nota: z.number().int().min(1, "Nota mínima é 1").max(5, "Nota máxima é 5"),
  comentario: z.string().trim().min(1).max(1000, "Comentário com no máximo 1000 caracteres").optional(),
});

/** GET /pro/sessions?limit= — histórico do painel do psicólogo. */
export const proSessionsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

/** GET /me/sessions?limit= — histórico do paciente. */
export const patientSessionsQuerySchema = proSessionsQuerySchema;

/** GET /psychologists — filtros do cardápio. */
export const psychologistsQuerySchema = z.object({
  q: z.string().trim().max(80).optional(),
  especialidade: z.string().trim().min(1).max(60).optional(),
  abordagem: z.string().trim().min(1).max(60).optional(),
  precoMin: z.coerce.number().int().nonnegative().optional(),
  precoMax: z.coerce.number().int().positive().optional(),
  minNota: z.coerce.number().min(1).max(5).optional(),
  /** Default true = só AVAILABLE; false = todos VERIFIED. */
  disponivel: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => (v === undefined ? true : v === "true")),
});
