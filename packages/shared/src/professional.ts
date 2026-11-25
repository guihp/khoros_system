/**
 * Identificação pública do psicólogo (Res. CFP 09/2024 + orientação CRP-06):
 * perfil público só com Nome completo + título "Psicólogo(a)" + CRP (Região/Número).
 */
export const PROFESSIONAL_TITLE = "Psicólogo(a)";

/** Formato oficial: "CRP 06/123456" (região antes do número). */
export function formatCrp(regiao?: string | null, numero?: string | null): string | null {
  const r = regiao?.trim();
  const n = numero?.trim();
  if (!r || !n) return null;
  return `CRP ${r.padStart(2, "0")}/${n}`;
}

/** Nome completo = pelo menos nome e sobrenome. */
export function isFullName(name?: string | null): boolean {
  if (!name) return false;
  return name.trim().split(/\s+/).filter((p) => p.length >= 2).length >= 2;
}

/** Perfil apto a aparecer publicamente (além do crp_status = VERIFIED no banco). */
export function hasPublicIdentification(p: {
  fullName?: string | null | undefined;
  crpRegiao?: string | null | undefined;
  crpNumero?: string | null | undefined;
}): boolean {
  return isFullName(p.fullName) && formatCrp(p.crpRegiao, p.crpNumero) !== null;
}
