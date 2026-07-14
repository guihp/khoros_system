/**
 * Suite obrigatória do motor de bilhetagem (CLAUDE.md §"Como trabalhar"):
 *   1. minuto exato
 *   2. queda de conexão (pausa, reconexão, cobrança justa)
 *   3. saldo zerando no meio da sessão
 *   4. sessão simultânea (corrida pelo mesmo psicólogo) — ver lock.test.ts
 *   5. tentativa de fraude de relógio — ver heartbeat.test.ts + aqui
 *   6. idempotência de débito (retry / crash do worker)
 */

import { describe, expect, it } from "vitest";
import { BillingEngine, type Effect } from "./engine.js";

const T0 = 1_000_000_000_000; // época arbitrária do servidor
const PRICE = 300; // R$ 3,00/min
const BUDGET_30MIN = PRICE * 30;

function makeEngine(budgetCents = BUDGET_30MIN) {
  return new BillingEngine({
    sessionId: "s1",
    pricePerMinuteCents: PRICE,
    takeRate: 0.2,
    budgetCents,
    startedAtMs: T0,
  });
}

/** Simula os dois lados batendo a cada 5s até `untilMs`, coletando efeitos. */
function beatBoth(engine: BillingEngine, fromMs: number, untilMs: number): Effect[] {
  const effects: Effect[] = [];
  for (let t = fromMs; t <= untilMs; t += 5_000) {
    effects.push(...engine.recordBeat("patient", t));
    effects.push(...engine.recordBeat("psychologist", t));
  }
  return effects;
}

const debits = (fx: Effect[]) => fx.filter((e) => e.type === "DEBIT_MINUTE");

describe("1 · minuto exato", () => {
  it("cobra exatamente 1 unidade por minuto completo coberto pelos dois lados", () => {
    const engine = makeEngine();
    const fx = beatBoth(engine, T0 + 5_000, T0 + 180_000); // 3 minutos de beats
    const ds = debits(fx);
    expect(ds).toHaveLength(3);
    expect(ds.map((d) => d.idempotencyKey)).toEqual([
      "sess:s1:min:1",
      "sess:s1:min:2",
      "sess:s1:min:3",
    ]);
    expect(ds.every((d) => d.amountCents === -PRICE)).toBe(true);
  });

  it("59 segundos de conversa = mínimo de 1 unidade no encerramento, nunca 2", () => {
    const engine = makeEngine();
    beatBoth(engine, T0 + 5_000, T0 + 55_000);
    const fx = engine.end(T0 + 59_000, "PATIENT_ENDED");
    const ds = debits(fx);
    expect(ds).toHaveLength(1); // mínimo após aceite
    const ended = fx.find((e) => e.type === "ENDED");
    expect(ended).toMatchObject({ billedUnits: 1, totalCents: PRICE });
  });

  it("não cobra minuto além do coberto por heartbeat (lado lento limita)", () => {
    const engine = makeEngine();
    // paciente bate até 120s, psicólogo só até 60s → cobertura comprovada = 60s
    for (let t = T0 + 5_000; t <= T0 + 120_000; t += 5_000) {
      engine.recordBeat("patient", t);
      if (t <= T0 + 60_000) engine.recordBeat("psychologist", t);
    }
    const fx = engine.end(T0 + 121_000, "PSY_ENDED");
    const ended = fx.find((e) => e.type === "ENDED");
    expect(ended).toMatchObject({ billedUnits: 1, paidSeconds: 60 });
  });
});

describe("2 · queda de conexão", () => {
  it("suspende após ~15s sem beat de um lado e NÃO cobra o período suspenso", () => {
    const engine = makeEngine();
    beatBoth(engine, T0 + 5_000, T0 + 60_000); // 1 min ok
    // paciente some; psicólogo continua batendo
    let suspendFx: Effect[] = [];
    for (let t = T0 + 65_000; t <= T0 + 90_000; t += 5_000) {
      suspendFx.push(...engine.recordBeat("psychologist", t));
    }
    expect(suspendFx.some((e) => e.type === "SUSPENDED")).toBe(true);
    expect(engine.status).toBe("SUSPENDED");

    // reconecta aos 100s (dentro da janela de 60s)
    const resumeFx = [
      ...engine.recordBeat("patient", T0 + 100_000),
      ...engine.recordBeat("psychologist", T0 + 100_000),
    ];
    expect(resumeFx.some((e) => e.type === "RESUMED")).toBe(true);

    // segue mais 60s de conversa e encerra
    beatBoth(engine, T0 + 105_000, T0 + 160_000);
    const fx = engine.end(T0 + 160_000, "PATIENT_ENDED");
    const ended = fx.find((e) => e.type === "ENDED") as Extract<Effect, { type: "ENDED" }>;
    // cobertura: 60s antes da queda + 60s após reconexão = 120s → 2 unidades.
    // O intervalo suspenso (60s→100s) não conta.
    expect(ended.paidSeconds).toBe(120);
    expect(ended.billedUnits).toBe(2);
  });

  it("sem reconexão em 60s encerra por TIMEOUT_RECONNECT cobrando só até o último beat válido", () => {
    const engine = makeEngine();
    beatBoth(engine, T0 + 5_000, T0 + 90_000); // 90s comprovados
    // ninguém mais bate; ticker segue rodando
    const fx: Effect[] = [];
    for (let t = T0 + 95_000; t <= T0 + 180_000; t += 10_000) {
      fx.push(...engine.tick(t));
    }
    expect(fx.some((e) => e.type === "SUSPENDED")).toBe(true);
    const ended = fx.find((e) => e.type === "ENDED") as Extract<Effect, { type: "ENDED" }>;
    expect(ended.reason).toBe("TIMEOUT_RECONNECT");
    expect(ended.paidSeconds).toBe(90); // até o último heartbeat, nem 1s além
    expect(ended.billedUnits).toBe(1); // 90s → 1 minuto completo
  });
});

describe("3 · saldo zerando", () => {
  it("avisa aos 5 e 2 minutos restantes e encerra por NO_BALANCE com aviso prévio", () => {
    const budget = PRICE * 7; // 7 minutos de orçamento
    const engine = makeEngine(budget);
    const fx = beatBoth(engine, T0 + 5_000, T0 + 8 * 60_000); // tenta conversar 8 min

    const low = fx.find((e) => e.type === "WARN_LOW_BALANCE");
    const critical = fx.find((e) => e.type === "WARN_CRITICAL_BALANCE");
    const endingSoon = fx.find((e) => e.type === "ENDING_SOON");
    const ended = fx.find((e) => e.type === "ENDED") as Extract<Effect, { type: "ENDED" }>;

    expect(low).toBeDefined();
    expect(critical).toBeDefined();
    expect(endingSoon).toBeDefined();
    expect(ended.reason).toBe("NO_BALANCE");
    // jamais cobra além do orçamento
    expect(ended.totalCents).toBeLessThanOrEqual(budget);
    expect(debits(fx)).toHaveLength(7);
  });

  it("recarga durante o aviso cancela o encerramento", () => {
    const budget = PRICE * 2;
    const engine = makeEngine(budget);
    const fx = beatBoth(engine, T0 + 5_000, T0 + 2 * 60_000 + 10_000);
    expect(fx.some((e) => e.type === "ENDING_SOON")).toBe(true);
    expect(engine.status).not.toBe("ENDED");

    engine.increaseBudget(PRICE * 10); // Pix caiu no meio do aviso
    const fx2 = beatBoth(engine, T0 + 2 * 60_000 + 15_000, T0 + 5 * 60_000);
    expect(fx2.some((e) => e.type === "ENDED")).toBe(false);
    expect(engine.status).toBe("ACTIVE");
    expect(debits(fx2).length).toBeGreaterThan(0); // voltou a cobrar normalmente
  });
});

describe("5 · fraude de relógio", () => {
  it("beat com carimbo retrocedido não desconta cobertura nem quebra o motor", () => {
    const engine = makeEngine();
    beatBoth(engine, T0 + 5_000, T0 + 60_000);
    // servidor jamais regride: beat 'antigo' é ignorado na atualização
    engine.recordBeat("patient", T0 + 10_000);
    const fx = engine.end(T0 + 61_000, "PATIENT_ENDED");
    const ended = fx.find((e) => e.type === "ENDED") as Extract<Effect, { type: "ENDED" }>;
    expect(ended.paidSeconds).toBe(60);
  });

  it("beats acelerados (cliente 'adianta o relógio' enviando rajada) não aceleram o tempo", () => {
    const engine = makeEngine();
    // rajada de 1000 beats no MESMO instante do servidor: tempo real não passou
    const fx: Effect[] = [];
    for (let i = 0; i < 1000; i++) {
      fx.push(...engine.recordBeat("patient", T0 + 5_000));
      fx.push(...engine.recordBeat("psychologist", T0 + 5_000));
    }
    expect(debits(fx)).toHaveLength(0); // 5s de servidor = zero minutos
  });
});

describe("6 · idempotência de débito", () => {
  it("retomada de crash a partir do snapshot não re-emite débitos já feitos", () => {
    const engine = makeEngine();
    const fx1 = beatBoth(engine, T0 + 5_000, T0 + 125_000); // 2 minutos debitados
    expect(debits(fx1)).toHaveLength(2);

    // worker morre; novo processo restaura do snapshot e reprocessa ticks
    const revived = new BillingEngine(
      {
        sessionId: "s1",
        pricePerMinuteCents: PRICE,
        takeRate: 0.2,
        budgetCents: BUDGET_30MIN,
        startedAtMs: T0,
      },
      engine.snapshot(),
    );
    const replay = [
      ...revived.tick(T0 + 125_000),
      ...revived.tick(T0 + 126_000),
      ...revived.tick(T0 + 127_000),
    ];
    expect(debits(replay)).toHaveLength(0); // nada duplicado

    // e as chaves de idempotência são determinísticas por minuto
    const fx2 = beatBoth(revived, T0 + 130_000, T0 + 185_000);
    expect(debits(fx2).map((d) => d.idempotencyKey)).toEqual(["sess:s1:min:3"]);
  });

  it("ticks repetidos no mesmo instante nunca duplicam débito", () => {
    const engine = makeEngine();
    beatBoth(engine, T0 + 5_000, T0 + 65_000);
    const fx = [
      ...engine.tick(T0 + 65_000),
      ...engine.tick(T0 + 65_000),
      ...engine.tick(T0 + 65_000),
    ];
    expect(debits(fx)).toHaveLength(0); // o débito do minuto 1 já saiu no beat
  });

  it("split soma exatamente o total, arredondando a favor do psicólogo", () => {
    const engine = new BillingEngine({
      sessionId: "s2",
      pricePerMinuteCents: 333, // força arredondamento
      takeRate: 0.2,
      budgetCents: 333 * 10,
      startedAtMs: T0,
    });
    for (let t = T0 + 5_000; t <= T0 + 60_000; t += 5_000) {
      engine.recordBeat("patient", t);
      engine.recordBeat("psychologist", t);
    }
    const ended = engine
      .end(T0 + 61_000, "PATIENT_ENDED")
      .find((e) => e.type === "ENDED") as Extract<Effect, { type: "ENDED" }>;
    expect(ended.psychologistCents + ended.platformCents).toBe(ended.totalCents);
    expect(ended.psychologistCents).toBe(Math.ceil(333 * 0.8)); // 267, favor do psicólogo
  });
});
