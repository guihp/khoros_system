/**
 * Autenticação/autorização Fastify: verifica o JWT do Supabase (JWKS) e
 * resolve o papel de domínio (users.role) para checagens de acesso.
 *
 * `requireAuth` aceita qualquer usuário com token válido, MESMO que ainda não
 * tenha completado /auth/register (necessário para o próprio fluxo de
 * cadastro). `requireRole` exige, além do token válido, cadastro completo
 * com um dos papéis permitidos.
 */

import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { UserRole, UserStatus } from "@khoros/shared";
import { InvalidTokenError, verifyAccessToken } from "../lib/auth.js";

export interface AuthUser {
  id: string;
  email: string;
  /** null quando o token é válido mas /auth/register ainda não foi chamado. */
  role: UserRole | null;
  status: UserStatus | null;
  registered: boolean;
}

declare module "fastify" {
  interface FastifyRequest {
    authUser?: AuthUser;
  }
  interface FastifyInstance {
    requireAuth: (req: FastifyRequest, reply: FastifyReply) => Promise<void>;
    requireRole: (
      ...roles: UserRole[]
    ) => (req: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

export async function registerAuthPlugin(app: FastifyInstance): Promise<void> {
  app.decorate("requireAuth", async (req: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
      await reply.code(401).send({ error: "UNAUTHENTICATED", message: "Bearer token ausente." });
      return;
    }
    const token = header.slice("Bearer ".length);
    try {
      const verified = await verifyAccessToken(app.env.SUPABASE_JWKS_URL, token);
      const { data } = await app.supabase
        .from("users")
        .select("id, role, status")
        .eq("id", verified.sub)
        .maybeSingle();
      req.authUser = {
        id: verified.sub,
        email: verified.email,
        role: (data?.role as UserRole | undefined) ?? null,
        status: (data?.status as UserStatus | undefined) ?? null,
        registered: !!data,
      };
    } catch (err) {
      const message = err instanceof InvalidTokenError ? err.message : "Token inválido.";
      await reply.code(401).send({ error: "INVALID_TOKEN", message });
    }
  });

  app.decorate("requireRole", (...roles: UserRole[]) => {
    return async (req: FastifyRequest, reply: FastifyReply): Promise<void> => {
      await app.requireAuth(req, reply);
      if (reply.sent) return;
      if (!req.authUser?.registered || !req.authUser.role || !roles.includes(req.authUser.role)) {
        await reply.code(403).send({ error: "FORBIDDEN", message: "Papel não autorizado para este recurso." });
        return;
      }
      if (req.authUser.status !== "ACTIVE") {
        await reply.code(403).send({ error: "ACCOUNT_INACTIVE", message: "Conta suspensa ou removida." });
      }
    };
  });
}
