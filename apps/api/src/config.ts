import { z } from "zod";

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
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  SUPABASE_JWT_SECRET: z.string().min(1),

  LIVEKIT_URL: z.string().url(),
  LIVEKIT_API_KEY: z.string().min(1),
  LIVEKIT_API_SECRET: z.string().min(1),
  LIVEKIT_WEBHOOK_KEY: z.string().min(1).optional(),

  ASAAS_BASE_URL: z.string().url().default("https://api-sandbox.asaas.com/v3"),
  ASAAS_API_KEY: z.string().min(1),
  ASAAS_WEBHOOK_TOKEN: z.string().min(1),

  /** Chave-mestra para cifra de coluna (CPF, prontuário, segredo de heartbeat). */
  COLUMN_ENCRYPTION_KEY: z.string().length(64, "hex de 32 bytes"),

  SENTRY_DSN: z.string().url().optional(),
  WEB_ORIGIN: z.string().url().default("http://localhost:3000"),
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
