/**
 * WS /ws?token=<jwt> — heartbeats do paciente/psicólogo durante a sessão +
 * push de eventos (incoming_call, session_state, avisos de saldo, encerramento).
 *
 * Autenticação por query param porque o WebSocket do browser não permite
 * header Authorization customizado no handshake.
 */

import type { FastifyInstance } from "fastify";
import { heartbeatSchema } from "@khoros/shared";
import { InvalidTokenError, verifyAccessToken } from "../../lib/auth.js";

export async function registerSessionWsRoute(app: FastifyInstance): Promise<void> {
  app.get("/ws", { websocket: true }, async (socket, req) => {
    const query = req.query as { token?: string };
    if (!query.token) {
      socket.close(4401, "token ausente");
      return;
    }

    let userId: string;
    try {
      const verified = await verifyAccessToken(app.env.SUPABASE_JWKS_URL, query.token);
      userId = verified.sub;
    } catch (err) {
      const reason = err instanceof InvalidTokenError ? err.message : "token inválido";
      socket.close(4401, reason);
      return;
    }

    app.sessionRuntime.registerConnection(userId, socket);
    req.log.debug({ userId }, "WS conectado");

    socket.on("message", (raw: unknown) => {
      let parsed: unknown;
      try {
        parsed = JSON.parse(typeof raw === "string" ? raw : String(raw));
      } catch {
        return;
      }
      const heartbeat = heartbeatSchema.safeParse(parsed);
      if (!heartbeat.success) return;
      void app.sessionRuntime.handleHeartbeat(userId, heartbeat.data);
    });

    socket.on("close", () => {
      app.sessionRuntime.unregisterConnection(userId, socket);
      req.log.debug({ userId }, "WS desconectado");
    });
  });
}
