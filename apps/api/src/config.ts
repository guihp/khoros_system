import { z } from "zod";

/**
 * Coolify (e painéis de env) costumam definir chaves opcionais como "".
 * Zod `.optional()` / `.url()` / `.email()` não aceitam string vazia.
 */
function emptyToUndefined(value: unknown): unknown {
  return value === "" ? undefined : value;
}

/**
 * Variáveis de ambiente da API. Falha rápido no boot se algo faltar.
 * Documentação de cada uma no .env.example da raiz.
 */
const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(3001),
  HOST: z.string().default("0.0.0.0"),

  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),

  SUPABASE_URL: z.string().url(),
  /** Chave secreta (sb_secret_…) — server-only. Nunca no front. */
  SUPABASE_SECRET_KEY: z.string().min(1),
  /** Publishable (sb_publishable_…) — opcional na API; usada no web. */
  SUPABASE_PUBLISHABLE_KEY: z.preprocess(emptyToUndefined, z.string().min(1).optional()),
  /** JWKS do Auth — verificação de JWT assimétrico (sem JWT secret legado). */
  SUPABASE_JWKS_URL: z.string().url(),

  LIVEKIT_URL: z.string().url(),
  LIVEKIT_API_KEY: z.string().min(1),
  LIVEKIT_API_SECRET: z.string().min(1),
  LIVEKIT_WEBHOOK_KEY: z.preprocess(emptyToUndefined, z.string().min(1).optional()),

  ASAAS_BASE_URL: z.string().url().default("https://api-sandbox.asaas.com/v3"),
  /** Placeholder `FALTA…` = Pix desligado (ver wallet/asaas.ts). Vazio/ausente → placeholder. */
  ASAAS_API_KEY: z.preprocess(emptyToUndefined, z.string().min(1).default("FALTA_ASAAS_API_KEY")),
  ASAAS_WEBHOOK_TOKEN: z.preprocess(
    emptyToUndefined,
    z.string().min(1).default("FALTA_ASAAS_WEBHOOK_TOKEN"),
  ),

  /** Chave-mestra para cifra de coluna (CPF, prontuário, segredo de heartbeat). */
  COLUMN_ENCRYPTION_KEY: z.string().length(64, "hex de 32 bytes"),

  SENTRY_DSN: z.preprocess(emptyToUndefined, z.string().url().optional()),
  WEB_ORIGIN: z.string().url().default("http://localhost:3000"),

  /**
   * Caminhos opcionais para cert/key HTTPS locais (gerados por
   * scripts/gen-certs.sh). Só usados em dev, para testar no celular: uma
   * página HTTPS não pode chamar uma API HTTP (mixed content) e
   * navigator.mediaDevices exige contexto seguro. Ver `pnpm dev:https`.
   */
  HTTPS_KEY_FILE: z.string().optional(),
  HTTPS_CERT_FILE: z.string().optional(),

  /** Se definido, o primeiro POST /auth/register com este e-mail pode se cadastrar como ADMIN. */
  BOOTSTRAP_ADMIN_EMAIL: z.preprocess(emptyToUndefined, z.string().email().optional()),
});

export type Env = z.infer<typeof envSchema>;

export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const parsed = envSchema.safeParse(source);
  if (!parsed.success) {
    const missing = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`);
    throw new Error(`Configuração inválida:\n  ${missing.join("\n  ")}`);
  }
  return parsed.data;
}
