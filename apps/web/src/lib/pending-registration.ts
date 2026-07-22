/**
 * Backup do payload de cadastro pendente. A fonte principal é o
 * `user_metadata.khoros_register` do próprio Supabase Auth (sobrevive à
 * confirmação de e-mail em qualquer navegador/dispositivo). Este localStorage
 * keyed por e-mail é só um backup local para o caso raro de o metadata não
 * estar disponível (ex.: `updateUser` falhou antes de gravar).
 */
const STORAGE_PREFIX = "khoros_pending_registration:";

function storageKey(email: string): string {
  return `${STORAGE_PREFIX}${email.trim().toLowerCase()}`;
}

export function writePendingRegistration(email: string, payload: Record<string, unknown>): void {
  if (typeof window === "undefined" || !email) return;
  try {
    localStorage.setItem(storageKey(email), JSON.stringify(payload));
  } catch {
    // localStorage indisponível (ex.: modo privado) — metadata do Auth já cobre o caso.
  }
}

export function readPendingRegistration(email: string | null | undefined): Record<string, unknown> | null {
  if (typeof window === "undefined" || !email) return null;
  const raw = localStorage.getItem(storageKey(email));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function clearPendingRegistration(email: string | null | undefined): void {
  if (typeof window === "undefined" || !email) return;
  try {
    localStorage.removeItem(storageKey(email));
  } catch {
    // ignora — não é crítico.
  }
}
