/** Formatação simples de avaliações (nota 1-5) — sem libs externas, pt-BR. */

export function formatRatingValue(value: number): string {
  return value.toFixed(1).replace(".", ",");
}

/** Ex.: starsText(4) === "★★★★☆". Usa caracteres unicode simples, sem emoji. */
export function starsText(nota: number, max = 5): string {
  const filled = Math.max(0, Math.min(max, Math.round(nota)));
  return "★".repeat(filled) + "☆".repeat(max - filled);
}

export function formatReviewDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return iso;
  }
}
