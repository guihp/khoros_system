/**
 * Lock atômico do psicólogo: impede que dois pacientes iniciem sessão com o
 * mesmo profissional ao mesmo tempo. Semântica SET NX EX do Redis; a interface
 * é injetável para permitir teste determinístico da corrida.
 */

export interface AtomicKV {
  /** SET key value NX EX ttlSeconds → true se adquiriu. */
  setNx(key: string, value: string, ttlSeconds: number): Promise<boolean>;
  get(key: string): Promise<string | null>;
  /** Deleta apenas se o valor bater (unlock seguro). */
  delIfEquals(key: string, value: string): Promise<boolean>;
}

const LOCK_TTL_SECONDS = 45;

export function psyLockKey(psychologistId: string): string {
  return `lock:psy:${psychologistId}`;
}

export async function acquirePsychologistLock(
  kv: AtomicKV,
  psychologistId: string,
  sessionId: string,
): Promise<boolean> {
  return kv.setNx(psyLockKey(psychologistId), sessionId, LOCK_TTL_SECONDS);
}

export async function releasePsychologistLock(
  kv: AtomicKV,
  psychologistId: string,
  sessionId: string,
): Promise<boolean> {
  return kv.delIfEquals(psyLockKey(psychologistId), sessionId);
}

/** Implementação Redis (ioredis) usada em produção. */
export function redisAtomicKV(redis: {
  set: (...args: unknown[]) => Promise<unknown>;
  get: (key: string) => Promise<string | null>;
  eval: (...args: unknown[]) => Promise<unknown>;
}): AtomicKV {
  return {
    async setNx(key, value, ttlSeconds) {
      const res = await redis.set(key, value, "EX", ttlSeconds, "NX");
      return res === "OK";
    },
    get: (key) => redis.get(key),
    async delIfEquals(key, value) {
      // unlock atômico: só apaga se ainda formos os donos
      const script = `if redis.call("get", KEYS[1]) == ARGV[1] then return redis.call("del", KEYS[1]) else return 0 end`;
      const res = await redis.eval(script, 1, key, value);
      return res === 1;
    },
  };
}
