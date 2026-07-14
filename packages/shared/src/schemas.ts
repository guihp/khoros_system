import { z } from "zod";
import { TOPUP_MAX_CENTS, TOPUP_MIN_CENTS } from "./constants.js";

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
