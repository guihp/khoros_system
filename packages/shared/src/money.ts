/** Aritmética de dinheiro do domínio. Sempre centavos inteiros. */

import { BILLING_UNIT_SECONDS, MIN_BILLED_UNITS } from "./constants.js";

/**
 * Unidades de cobrança devidas por um tempo corrido de sessão.
 * Cobra por unidade COMPLETA decorrida, com mínimo após o aceite.
 * Ex.: 59s → 1 (mínimo); 60s → 1; 61s → 1; 120s → 2.
 */
export function billedUnits(elapsedSeconds: number): number {
  if (elapsedSeconds <= 0) return 0;
  return Math.max(MIN_BILLED_UNITS, Math.floor(elapsedSeconds / BILLING_UNIT_SECONDS));
}

export function sessionTotalCents(elapsedSeconds: number, pricePerMinuteCents: number): number {
  return billedUnits(elapsedSeconds) * pricePerMinuteCents;
}

/**
 * Divisão do valor entre psicólogo e plataforma.
 * Arredondamento sempre a favor do psicólogo; diferença de centavo fica na conta,
 * mas a soma das partes é SEMPRE igual ao total (invariante do ledger).
 */
export function splitAmounts(
  totalCents: number,
  takeRate: number,
): { psychologistCents: number; platformCents: number } {
  if (totalCents < 0) throw new Error("totalCents negativo");
  if (takeRate < 0 || takeRate >= 1) throw new Error("takeRate fora de [0, 1)");
  const psychologistCents = Math.ceil(totalCents * (1 - takeRate));
  return { psychologistCents, platformCents: totalCents - psychologistCents };
}

export function formatBRL(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
