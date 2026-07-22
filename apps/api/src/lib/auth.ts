/**
 * Verificação de JWT do Supabase Auth via JWKS (assimétrico — sem JWT secret legado).
 */

import { createRemoteJWKSet, jwtVerify, type JWTPayload } from "jose";

const jwksCache = new Map<string, ReturnType<typeof createRemoteJWKSet>>();

function getJwks(jwksUrl: string): ReturnType<typeof createRemoteJWKSet> {
  const cached = jwksCache.get(jwksUrl);
  if (cached) return cached;
  const jwks = createRemoteJWKSet(new URL(jwksUrl));
  jwksCache.set(jwksUrl, jwks);
  return jwks;
}

export interface VerifiedUser {
  sub: string;
  email: string;
}

export class InvalidTokenError extends Error {}

export async function verifyAccessToken(jwksUrl: string, token: string): Promise<VerifiedUser> {
  const jwks = getJwks(jwksUrl);
  let payload: JWTPayload;
  try {
    const result = await jwtVerify(token, jwks);
    payload = result.payload;
  } catch (err) {
    throw new InvalidTokenError(err instanceof Error ? err.message : "token inválido");
  }
  const sub = payload.sub;
  const email = typeof payload.email === "string" ? payload.email : undefined;
  if (!sub) throw new InvalidTokenError("token sem sub");
  if (!email) throw new InvalidTokenError("token sem email");
  return { sub, email };
}
