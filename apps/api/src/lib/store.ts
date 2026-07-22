/**
 * KV atômico: Redis em produção, memória em dev/local quando Redis não
 * responde. Single process apenas — suficiente para o MVP local; em produção
 * multi-instância o Redis é obrigatório (o fallback é só para não bloquear
 * quem está sem `docker run redis` na máquina).
 */

import { Redis } from "ioredis";
import type { AtomicKV } from "../modules/presence/lock.js";
import { redisAtomicKV } from "../modules/presence/lock.js";
import type { Env } from "../config.js";

interface MemoryEntry {
  value: string;
  expiresAt: number;
}

/** Implementação em memória do mesmo contrato AtomicKV usado pelo lock.ts. */
export function memoryAtomicKV(): AtomicKV {
  const store = new Map<string, MemoryEntry>();

  function isLive(entry: MemoryEntry | undefined, now: number): entry is MemoryEntry {
    return !!entry && entry.expiresAt > now;
  }

  return {
    async setNx(key, value, ttlSeconds) {
      const now = Date.now();
      if (isLive(store.get(key), now)) return false;
      store.set(key, { value, expiresAt: now + ttlSeconds * 1000 });
      return true;
    },
    async get(key) {
      const now = Date.now();
      const entry = store.get(key);
      if (!isLive(entry, now)) {
        store.delete(key);
        return null;
      }
      return entry.value;
    },
    async delIfEquals(key, value) {
      const now = Date.now();
      const entry = store.get(key);
      if (isLive(entry, now) && entry.value === value) {
        store.delete(key);
        return true;
      }
      return false;
    },
  };
}

export interface StoreHandle {
  kv: AtomicKV;
  redis: Redis | null;
  mode: "redis" | "memory";
}

interface MinimalLogger {
  warn: (msg: string) => void;
  info: (msg: string) => void;
}

/** Tenta Redis; se indisponível (sem docker local, DNS, timeout…), cai para memória. */
export async function connectRedisOrMemory(env: Env, logger: MinimalLogger): Promise<StoreHandle> {
  const redis = new Redis(env.REDIS_URL, {
    lazyConnect: true,
    maxRetriesPerRequest: 1,
    connectTimeout: 1500,
    retryStrategy: () => null,
  });
  try {
    await redis.connect();
    await redis.ping();
    logger.info(`Redis conectado (${env.REDIS_URL}).`);
    // O contrato de redisAtomicKV é deliberadamente mínimo (lock.ts não é reescrito);
    // a instância real do ioredis satisfaz essas 3 chamadas em runtime.
    return { kv: redisAtomicKV(redis as unknown as Parameters<typeof redisAtomicKV>[0]), redis, mode: "redis" };
  } catch (err) {
    redis.disconnect();
    const reason = err instanceof Error ? err.message : String(err);
    if (env.NODE_ENV === "production") {
      throw new Error(
        `Redis obrigatório em produção (REDIS_URL=${env.REDIS_URL}): ${reason}`,
      );
    }
    logger.warn(
      `Redis indisponível (${reason}) — usando KV em memória (single-process, só para dev local).`,
    );
    return { kv: memoryAtomicKV(), redis: null, mode: "memory" };
  }
}
