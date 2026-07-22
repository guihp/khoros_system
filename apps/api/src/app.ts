import { readFileSync } from "node:fs";
import Fastify, { type FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import multipart from "@fastify/multipart";
import rateLimit from "@fastify/rate-limit";
import websocket from "@fastify/websocket";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Redis } from "ioredis";
import { AVATAR_MAX_BYTES } from "@khoros/shared";
import type { Env } from "./config.js";

/** Em dev, aceita localhost e IPs privados (teste no celular na mesma rede). */
function isDevWebOrigin(origin: string): boolean {
  try {
    const { hostname, protocol } = new URL(origin);
    if (protocol !== "http:" && protocol !== "https:") return false;
    if (hostname === "localhost" || hostname === "127.0.0.1") return true;
    return /^(192\.168\.|10\.|172\.(1[6-9]|2\d|3[01])\.)/.test(hostname);
  } catch {
    return false;
  }
}
import { createServiceClient } from "./lib/supabase.js";
import { connectRedisOrMemory, type StoreHandle } from "./lib/store.js";
import { registerAuthPlugin } from "./plugins/auth.js";
import { registerAuthRoutes } from "./modules/auth/routes.js";
import { registerConsentRoutes } from "./modules/consents/routes.js";
import { registerScreeningRoutes } from "./modules/screening/routes.js";
import { registerAdminRoutes } from "./modules/admin/routes.js";
import { registerWalletRoutes } from "./modules/wallet/routes.js";
import { registerAsaasWebhookRoutes } from "./modules/webhooks/asaas.js";
import { registerLiveKitWebhookRoutes } from "./modules/webhooks/livekit.js";
import { registerProfileRoutes } from "./modules/profiles/routes.js";
import { registerProRoutes } from "./modules/pro/routes.js";
import { registerPatientRoutes } from "./modules/patient/routes.js";
import { registerSessionRoutes } from "./modules/sessions/routes.js";
import { registerSessionWsRoute } from "./modules/sessions/ws.js";
import { SessionRuntime } from "./modules/sessions/runtime.js";
import type { AtomicKV } from "./modules/presence/lock.js";

declare module "fastify" {
  interface FastifyInstance {
    env: Env;
    supabase: SupabaseClient;
    kv: AtomicKV;
    redis: Redis | null;
    sessionRuntime: SessionRuntime;
  }
}

/**
 * Monta a aplicação sem dar listen — testável com fastify.inject().
 * Módulos de domínio são registrados aqui conforme os slices avançam.
 */
export async function buildApp(env: Env): Promise<FastifyInstance> {
  const httpsOptions =
    env.HTTPS_KEY_FILE && env.HTTPS_CERT_FILE
      ? {
          key: readFileSync(env.HTTPS_KEY_FILE),
          cert: readFileSync(env.HTTPS_CERT_FILE),
        }
      : null;

  const loggerOptions = {
    level: env.NODE_ENV === "production" ? "info" : ("debug" as const),
    // Nunca logar conteúdo clínico nem dados sensíveis.
    redact: ["req.headers.authorization", "*.cpf", "*.conteudo"],
  };

  // Overloads do Fastify diferenciam http/https pelo tipo do server — dois
  // literais separados (em vez de `https` opcional num único objeto) evitam
  // que o TS resolva para o overload errado e propague tipos incompatíveis.
  // trustProxy: Coolify/Traefik terminam TLS na borda — necessário para IP real
  // (rate limit) e esquemas corretos atrás do proxy.
  const app = (
    httpsOptions
      ? Fastify({ https: httpsOptions, logger: loggerOptions, trustProxy: true })
      : Fastify({ logger: loggerOptions, trustProxy: true })
  ) as FastifyInstance;

  // @fastify/cors só libera GET,HEAD,POST por padrão — sem isto, o preflight
  // (OPTIONS) responde 204 mas o navegador nunca envia o PATCH/PUT/DELETE real
  // (ex.: PATCH /pro/availability), e o cliente só vê um erro de rede genérico.
  await app.register(cors, {
    origin:
      env.NODE_ENV === "development"
        ? (origin, cb) => {
            if (!origin || origin === env.WEB_ORIGIN || isDevWebOrigin(origin)) {
              cb(null, true);
              return;
            }
            cb(null, false);
          }
        : env.WEB_ORIGIN,
    credentials: true,
    methods: ["GET", "HEAD", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
  });
  await app.register(multipart, {
    limits: { fileSize: AVATAR_MAX_BYTES, files: 1 },
  });
  await app.register(rateLimit, { max: 120, timeWindow: "1 minute" });
  await app.register(websocket);

  // Corpo bruto exigido pela verificação de assinatura do webhook LiveKit.
  app.addContentTypeParser("application/webhook+json", { parseAs: "string" }, (_req, body, done) => {
    done(null, body);
  });

  app.decorate("env", env);
  app.decorate("supabase", createServiceClient(env));

  const store: StoreHandle = await connectRedisOrMemory(env, app.log);
  app.decorate("kv", store.kv);
  app.decorate("redis", store.redis);
  app.addHook("onClose", async () => {
    if (app.redis) app.redis.disconnect();
  });

  await registerAuthPlugin(app);

  app.decorate("sessionRuntime", new SessionRuntime(app.supabase, app.kv, app.env, app.log));
  await app.sessionRuntime.reconcileOnBoot();

  app.get("/health", async () => ({ status: "ok", ts: new Date().toISOString(), storeMode: store.mode }));

  await registerAuthRoutes(app);
  await registerConsentRoutes(app);
  await registerScreeningRoutes(app);
  await registerAdminRoutes(app);
  await registerWalletRoutes(app);
  await registerAsaasWebhookRoutes(app);
  await registerLiveKitWebhookRoutes(app);
  await registerProfileRoutes(app);
  await registerProRoutes(app);
  await registerPatientRoutes(app);
  await registerSessionRoutes(app);
  await registerSessionWsRoute(app);

  return app;
}
