import Fastify, { type FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import websocket from "@fastify/websocket";
import type { Env } from "./config.js";

/**
 * Monta a aplicação sem dar listen — testável com fastify.inject().
 * Módulos de domínio são registrados aqui conforme os slices avançam.
 */
export async function buildApp(env: Env): Promise<FastifyInstance> {
  const app = Fastify({
    logger: {
      level: env.NODE_ENV === "production" ? "info" : "debug",
      // Nunca logar conteúdo clínico nem dados sensíveis.
      redact: ["req.headers.authorization", "*.cpf", "*.conteudo"],
    },
  });

  await app.register(cors, { origin: env.WEB_ORIGIN, credentials: true });
  await app.register(rateLimit, { max: 120, timeWindow: "1 minute" });
  await app.register(websocket);

  app.get("/health", async () => ({ status: "ok", ts: new Date().toISOString() }));

  return app;
}
