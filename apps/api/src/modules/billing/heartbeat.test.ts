/** Suite obrigatória, item 5: tentativa de fraude nos heartbeats. */

import { describe, expect, it } from "vitest";
import { HeartbeatValidator, signHeartbeat } from "./heartbeat.js";

const SECRET = "segredo-da-sessao-nunca-reutilizado";
const SESSION = "11111111-1111-1111-1111-111111111111";
const USER = "22222222-2222-2222-2222-222222222222";

describe("HeartbeatValidator", () => {
  it("aceita beat legítimo com HMAC correto e seq crescente", () => {
    const v = new HeartbeatValidator(SECRET, SESSION);
    for (const seq of [0, 1, 2, 7]) {
      const hmac = signHeartbeat(SECRET, SESSION, USER, seq);
      expect(v.validate(USER, seq, hmac).ok).toBe(true);
    }
  });

  it("rejeita HMAC forjado (sem o segredo da sessão)", () => {
    const v = new HeartbeatValidator(SECRET, SESSION);
    const forged = signHeartbeat("outro-segredo", SESSION, USER, 1);
    expect(v.validate(USER, 1, forged)).toEqual({ ok: false, rejection: "BAD_HMAC" });
  });

  it("rejeita replay: mesmo seq duas vezes", () => {
    const v = new HeartbeatValidator(SECRET, SESSION);
    const hmac = signHeartbeat(SECRET, SESSION, USER, 5);
    expect(v.validate(USER, 5, hmac).ok).toBe(true);
    expect(v.validate(USER, 5, hmac)).toEqual({ ok: false, rejection: "REPLAYED_SEQ" });
  });

  it("rejeita seq regressivo (rebobinar contador)", () => {
    const v = new HeartbeatValidator(SECRET, SESSION);
    expect(v.validate(USER, 10, signHeartbeat(SECRET, SESSION, USER, 10)).ok).toBe(true);
    expect(v.validate(USER, 3, signHeartbeat(SECRET, SESSION, USER, 3))).toEqual({
      ok: false,
      rejection: "REPLAYED_SEQ",
    });
  });

  it("HMAC válido de OUTRA sessão não serve nesta (segredo por sessão)", () => {
    const other = new HeartbeatValidator(SECRET, "33333333-3333-3333-3333-333333333333");
    const hmacForThisSession = signHeartbeat(SECRET, SESSION, USER, 1);
    expect(other.validate(USER, 1, hmacForThisSession).ok).toBe(false);
  });

  it("payload não tem campo de timestamp: relógio do cliente é estruturalmente ignorado", () => {
    // Garantia de design: a assinatura cobre apenas sessionId:userId:seq.
    // Qualquer 'tempo' que o cliente queira alegar simplesmente não existe no protocolo.
    const a = signHeartbeat(SECRET, SESSION, USER, 1);
    const b = signHeartbeat(SECRET, SESSION, USER, 1);
    expect(a).toBe(b); // determinístico, sem entrada de tempo
  });
});
