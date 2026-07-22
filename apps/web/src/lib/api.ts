/**
 * Cliente HTTP fino para a API KHOROS (Fastify).
 * Contrato esperado (ver CLAUDE.md / plano de slices): Authorization: Bearer <access_token>.
 * A API ainda está em construção em paralelo — este cliente é deliberadamente
 * tolerante a variações de formato de erro/sucesso.
 */

const CONFIGURED_API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

/**
 * Resolve a URL da API, promovendo http→https quando a própria página foi
 * carregada em HTTPS (ex.: `pnpm dev:https` para testar câmera/microfone no
 * celular via IP da LAN). Uma página HTTPS não pode chamar uma API HTTP —
 * o navegador bloqueia por "mixed content" — então a API precisa estar
 * servindo HTTPS no mesmo host quando isso ocorre (ver scripts/gen-certs.sh).
 */
function resolveApiUrl(): string {
  if (typeof window === "undefined") return CONFIGURED_API_URL;
  try {
    const url = new URL(CONFIGURED_API_URL);
    if (window.location.protocol === "https:" && url.protocol === "http:") {
      url.protocol = "https:";
    }
    return url.toString().replace(/\/$/, "");
  } catch {
    return CONFIGURED_API_URL;
  }
}

const API_URL = resolveApiUrl();

export class ApiError extends Error {
  status: number;
  details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

interface FetchApiOptions {
  token?: string | null;
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  /** Não lançar em resposta não-OK; retorna null e deixa o chamador decidir. */
  allowError?: boolean;
}

/** Códigos de erro conhecidos da API → mensagem amigável em pt-BR. */
const ERROR_CODE_MESSAGES: Record<string, string> = {
  VALIDATION: "Alguns dados informados não são válidos. Revise o formulário.",
  ALREADY_REGISTERED: "Esta conta já tem um cadastro completo.",
  ADMIN_BOOTSTRAP_ONLY: "Este e-mail não está autorizado a criar uma conta de administrador.",
  NOT_REGISTERED: "Complete seu cadastro para continuar.",
  REGISTER_FAILED: "Não foi possível concluir o cadastro. Tente novamente.",
  FORBIDDEN: "Você não tem permissão para acessar este recurso.",
  ACCOUNT_INACTIVE: "Sua conta está suspensa ou inativa.",
  UNAUTHENTICATED: "Sua sessão expirou. Entre novamente.",
  INVALID_TOKEN: "Sua sessão expirou. Entre novamente.",
  NOT_FOUND: "Não encontramos o que você procurava.",
  EMPTY_UPDATE: "Nenhuma alteração para salvar.",
};

/** Tenta extrair uma mensagem de erro legível de formatos comuns (Fastify, Zod, texto puro). */
function extractErrorMessage(payload: unknown, fallback: string): string {
  if (!payload) return fallback;
  if (typeof payload === "string") return payload;
  if (typeof payload === "object") {
    const obj = payload as Record<string, unknown>;
    // Erros de validação (Zod) trazem `issues` com mensagens específicas por campo —
    // sempre mais úteis que o código genérico `error` (ex.: "VALIDATION").
    if (Array.isArray(obj.issues) && obj.issues.length > 0) {
      return obj.issues
        .map((i) => (typeof i === "object" && i && "message" in i ? String(i.message) : String(i)))
        .join("; ");
    }
    if (typeof obj.message === "string") return obj.message;
    if (typeof obj.error === "string") return ERROR_CODE_MESSAGES[obj.error] ?? obj.error;
  }
  return fallback;
}

export async function fetchApi<T = unknown>(path: string, options: FetchApiOptions = {}): Promise<T> {
  const { token, method = "GET", body, allowError = false } = options;

  const headers: Record<string, string> = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (err) {
    throw new ApiError(
      "Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.",
      0,
      err,
    );
  }

  const text = await res.text();
  let payload: unknown = undefined;
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = text;
    }
  }

  if (!res.ok) {
    const message = extractErrorMessage(payload, `Erro inesperado (${res.status})`);
    if (allowError) throw new ApiError(message, res.status, payload);
    throw new ApiError(message, res.status, payload);
  }

  return payload as T;
}

/** Upload multipart (não define Content-Type — o browser define o boundary). */
export async function uploadApiFile<T = unknown>(
  path: string,
  file: File,
  token: string,
  fieldName = "file",
): Promise<T> {
  const form = new FormData();
  form.append(fieldName, file);

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    });
  } catch (err) {
    throw new ApiError(
      "Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.",
      0,
      err,
    );
  }

  const text = await res.text();
  let payload: unknown = undefined;
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = text;
    }
  }

  if (!res.ok) {
    throw new ApiError(extractErrorMessage(payload, `Erro inesperado (${res.status})`), res.status, payload);
  }

  return payload as T;
}

/** Base para conexão WebSocket da sessão (troca http(s) por ws(s)). */
export function apiWsUrl(path: string): string {
  const wsBase = API_URL.replace(/^http/, "ws");
  return `${wsBase}${path}`;
}
