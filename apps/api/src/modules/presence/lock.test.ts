/** Suite obrigatória, item 4: corrida de dois pacientes pelo mesmo psicólogo. */

import { describe, expect, it } from "vitest";
import {
  acquirePsychologistLock,
  releasePsychologistLock,
  type AtomicKV,
} from "./lock.js";

/** Fake com semântica atômica de SET NX — determinístico para teste. */
function fakeKV(): AtomicKV {
  const store = new Map<string, string>();
  return {
    async setNx(key, value) {
      if (store.has(key)) return false;
      store.set(key, value);
      return true;
    },
    async get(key) {
      return store.get(key) ?? null;
    },
    async delIfEquals(key, value) {
      if (store.get(key) === value) {
        store.delete(key);
        return true;
      }
      return false;
    },
  };
}

const PSY = "psy-1";

describe("lock atômico do psicólogo", () => {
  it("dois pacientes simultâneos: exatamente um adquire o lock", async () => {
    const kv = fakeKV();
    const [a, b] = await Promise.all([
      acquirePsychologistLock(kv, PSY, "sessao-A"),
      acquirePsychologistLock(kv, PSY, "sessao-B"),
    ]);
    expect([a, b].filter(Boolean)).toHaveLength(1);
  });

  it("perdedor consegue adquirir depois que o vencedor libera", async () => {
    const kv = fakeKV();
    await acquirePsychologistLock(kv, PSY, "sessao-A");
    expect(await acquirePsychologistLock(kv, PSY, "sessao-B")).toBe(false);

    await releasePsychologistLock(kv, PSY, "sessao-A");
    expect(await acquirePsychologistLock(kv, PSY, "sessao-B")).toBe(true);
  });

  it("sessão que não é dona do lock não consegue liberá-lo", async () => {
    const kv = fakeKV();
    await acquirePsychologistLock(kv, PSY, "sessao-A");
    expect(await releasePsychologistLock(kv, PSY, "sessao-B")).toBe(false);
    // lock da sessão A permanece intacto
    expect(await acquirePsychologistLock(kv, PSY, "sessao-C")).toBe(false);
  });
});
