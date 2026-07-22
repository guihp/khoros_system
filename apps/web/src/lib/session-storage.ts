/**
 * GET /sessions/:id não garante devolver o token LiveKit/hbSecret (só existem
 * enquanto o runtime mantém a sessão em memória — ver apps/api SessionRuntime).
 * Por isso guardamos as credenciais recebidas em /sessions/start (paciente) e
 * /sessions/:id/accept (psicólogo) aqui, e a sala de sessão tenta ler daqui
 * primeiro, caindo para o GET só como fallback best-effort.
 */

export interface StoredSessionCredentials {
  livekitUrl: string;
  hbSecret: string;
  patientToken?: string;
  psychologistToken?: string;
}

function storageKey(sessionId: string): string {
  return `khoros_session_${sessionId}`;
}

export function saveSessionCredentials(sessionId: string, creds: StoredSessionCredentials): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(storageKey(sessionId), JSON.stringify(creds));
}

export function readSessionCredentials(sessionId: string): StoredSessionCredentials | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(storageKey(sessionId));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredSessionCredentials;
  } catch {
    return null;
  }
}

export function clearSessionCredentials(sessionId: string): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(storageKey(sessionId));
}
