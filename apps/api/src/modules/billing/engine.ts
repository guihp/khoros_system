/**
 * Motor de bilhetagem da KHOROS — máquina de estados PURA.
 *
 * Princípios inegociáveis:
 *  · O relógio é sempre injetado (`nowMs`): o servidor carimba o tempo no
 *    recebimento de cada evento. Nenhum timestamp de cliente entra aqui.
 *  · O tempo só conta enquanto há heartbeat fresco DOS DOIS lados, comprovado:
 *    a fronteira de cobertura avança até min(últimoBeatPaciente, últimoBeatPsicólogo).
 *    Um minuto só é debitado quando os beats de ambos os lados o cobrem —
 *    impossível cobrar minuto que não aconteceu.
 *  · Todo débito sai como efeito com chave de idempotência determinística
 *    (`sess:{id}:min:{n}`); reprocessar/replayar nunca duplica cobrança.
 *  · Este módulo não conhece Redis, Postgres nem LiveKit: recebe eventos,
 *    devolve efeitos. A camada de infraestrutura os aplica.
 */

import {
  BILLING_UNIT_SECONDS,
  CRITICAL_BALANCE_WARN_MINUTES,
  HEARTBEAT_STALE_MS,
  LOW_BALANCE_WARN_MINUTES,
  MIN_BILLED_UNITS,
  RECONNECT_WINDOW_MS,
  ZERO_BALANCE_GRACE_MS,
  splitAmounts,
  type EndReason,
} from "@khoros/shared";

export type Participant = "patient" | "psychologist";

export type EngineStatus = "ACTIVE" | "SUSPENDED" | "ENDED";

export type Effect =
  | { type: "DEBIT_MINUTE"; unit: number; amountCents: number; idempotencyKey: string }
  | { type: "WARN_LOW_BALANCE"; remainingMinutes: number }
  | { type: "WARN_CRITICAL_BALANCE"; remainingMinutes: number }
  | { type: "ENDING_SOON"; graceMs: number }
  | { type: "SUSPENDED"; atMs: number }
  | { type: "RESUMED"; atMs: number }
  | {
      type: "ENDED";
      reason: EndReason;
      paidSeconds: number;
      billedUnits: number;
      totalCents: number;
      psychologistCents: number;
      platformCents: number;
    };

export interface EngineSnapshot {
  sessionId: string;
  status: EngineStatus;
  startedAtMs: number;
  lastBeatMs: Record<Participant, number>;
  /** Instante até o qual o tempo já foi contabilizado. */
  coverFrontierMs: number;
  /** Segundos cobertos por heartbeat de ambos os lados (o que se cobra). */
  coveredSeconds: number;
  debitedUnits: number;
  suspendedAtMs: number | null;
  warnedLow: boolean;
  warnedCritical: boolean;
  zeroDeadlineMs: number | null;
  endReason: EndReason | null;
}

export interface EngineConfig {
  sessionId: string;
  pricePerMinuteCents: number;
  takeRate: number;
  /** Orçamento disponível do paciente (saldo livre + hold) em centavos. */
  budgetCents: number;
  /** Timestamp do servidor no aceite do psicólogo. */
  startedAtMs: number;
}

export class BillingEngine {
  private s: EngineSnapshot;
  private readonly price: number;
  private readonly takeRate: number;
  private budgetCents: number;

  constructor(cfg: EngineConfig, restore?: EngineSnapshot) {
    this.price = cfg.pricePerMinuteCents;
    this.takeRate = cfg.takeRate;
    this.budgetCents = cfg.budgetCents;
    this.s = restore ?? {
      sessionId: cfg.sessionId,
      status: "ACTIVE",
      startedAtMs: cfg.startedAtMs,
      lastBeatMs: { patient: cfg.startedAtMs, psychologist: cfg.startedAtMs },
      coverFrontierMs: cfg.startedAtMs,
      coveredSeconds: 0,
      debitedUnits: 0,
      suspendedAtMs: null,
      warnedLow: false,
      warnedCritical: false,
      zeroDeadlineMs: null,
      endReason: null,
    };
  }

  get status(): EngineStatus {
    return this.s.status;
  }

  /** Estado serializável para retomada após crash do worker. */
  snapshot(): EngineSnapshot {
    return structuredClone(this.s);
  }

  /** Recarga no meio da sessão aumenta o orçamento. */
  increaseBudget(cents: number): void {
    if (cents > 0) this.budgetCents += cents;
  }

  /**
   * Heartbeat VALIDADO (HMAC + seq conferidos na borda). O servidor carimba
   * `nowMs`; qualquer relógio do cliente já foi descartado antes daqui.
   */
  recordBeat(who: Participant, nowMs: number): Effect[] {
    if (this.s.status === "ENDED") return [];
    if (nowMs > this.s.lastBeatMs[who]) this.s.lastBeatMs[who] = nowMs;
    return this.tick(nowMs);
  }

  /** Avalia o relógio. Chamado pelo ticker (a cada poucos segundos) e a cada beat. */
  tick(nowMs: number): Effect[] {
    if (this.s.status === "ENDED") return [];
    const effects: Effect[] = [];

    if (this.s.status === "SUSPENDED") {
      const bothFresh =
        nowMs - this.s.lastBeatMs.patient <= HEARTBEAT_STALE_MS &&
        nowMs - this.s.lastBeatMs.psychologist <= HEARTBEAT_STALE_MS;
      if (bothFresh) {
        // Reconectou: o intervalo suspenso não é cobrado — fronteira salta para agora.
        this.s.status = "ACTIVE";
        this.s.suspendedAtMs = null;
        this.s.coverFrontierMs = nowMs;
        effects.push({ type: "RESUMED", atMs: nowMs });
      } else if (nowMs - (this.s.suspendedAtMs ?? nowMs) >= RECONNECT_WINDOW_MS) {
        return [...effects, ...this.end(nowMs, "TIMEOUT_RECONNECT")];
      } else {
        return effects;
      }
    }

    // ACTIVE: avança a cobertura até onde os DOIS lados comprovaram presença.
    const provenMs = Math.min(this.s.lastBeatMs.patient, this.s.lastBeatMs.psychologist);
    this.advanceCoverage(provenMs);

    const oldestBeatAgeMs = nowMs - provenMs;
    if (oldestBeatAgeMs > HEARTBEAT_STALE_MS) {
      this.s.status = "SUSPENDED";
      this.s.suspendedAtMs = nowMs;
      effects.push({ type: "SUSPENDED", atMs: nowMs });
      return effects;
    }

    effects.push(...this.settleDebits());
    effects.push(...this.checkBalance(nowMs));
    return effects;
  }

  /** Encerramento por qualquer lado, por admin ou por erro. */
  end(nowMs: number, reason: EndReason): Effect[] {
    if (this.s.status === "ENDED") return [];
    // Cobra apenas até o último heartbeat comprovado dos dois lados.
    const provenMs = Math.min(this.s.lastBeatMs.patient, this.s.lastBeatMs.psychologist);
    this.advanceCoverage(provenMs);

    this.s.status = "ENDED";
    this.s.endReason = reason;

    const effects: Effect[] = [];
    const paidSeconds = Math.floor(this.s.coveredSeconds);
    // Mínimo de 1 unidade após o aceite; teto: nunca além do orçamento.
    let units = Math.max(
      paidSeconds > 0 ? MIN_BILLED_UNITS : 0,
      Math.floor(paidSeconds / BILLING_UNIT_SECONDS),
    );
    units = Math.min(units, Math.floor(this.budgetCents / this.price));

    while (this.s.debitedUnits < units) {
      this.s.debitedUnits += 1;
      effects.push(this.debitEffect(this.s.debitedUnits));
    }

    const totalCents = this.s.debitedUnits * this.price;
    const { psychologistCents, platformCents } = splitAmounts(totalCents, this.takeRate);
    effects.push({
      type: "ENDED",
      reason,
      paidSeconds,
      billedUnits: this.s.debitedUnits,
      totalCents,
      psychologistCents,
      platformCents,
    });
    return effects;
  }

  // ── internos ──────────────────────────────────────────────────────────────

  private advanceCoverage(uptoMs: number): void {
    if (uptoMs > this.s.coverFrontierMs) {
      this.s.coveredSeconds += (uptoMs - this.s.coverFrontierMs) / 1000;
      this.s.coverFrontierMs = uptoMs;
    }
  }

  private debitEffect(unit: number): Effect {
    return {
      type: "DEBIT_MINUTE",
      unit,
      amountCents: -this.price,
      idempotencyKey: `sess:${this.s.sessionId}:min:${unit}`,
    };
  }

  private settleDebits(): Effect[] {
    const effects: Effect[] = [];
    const fullUnits = Math.floor(this.s.coveredSeconds / BILLING_UNIT_SECONDS);
    const affordableUnits = Math.floor(this.budgetCents / this.price);
    const target = Math.min(fullUnits, affordableUnits);
    while (this.s.debitedUnits < target) {
      this.s.debitedUnits += 1;
      effects.push(this.debitEffect(this.s.debitedUnits));
    }
    return effects;
  }

  private checkBalance(nowMs: number): Effect[] {
    const effects: Effect[] = [];
    const remainingCents = this.budgetCents - this.s.debitedUnits * this.price;
    const remainingMinutes = Math.floor(remainingCents / this.price);

    if (!this.s.warnedLow && remainingMinutes <= LOW_BALANCE_WARN_MINUTES) {
      this.s.warnedLow = true;
      effects.push({ type: "WARN_LOW_BALANCE", remainingMinutes });
    }
    if (!this.s.warnedCritical && remainingMinutes <= CRITICAL_BALANCE_WARN_MINUTES) {
      this.s.warnedCritical = true;
      effects.push({ type: "WARN_CRITICAL_BALANCE", remainingMinutes });
    }

    if (remainingMinutes <= 0) {
      if (this.s.zeroDeadlineMs === null) {
        this.s.zeroDeadlineMs = nowMs + ZERO_BALANCE_GRACE_MS;
        effects.push({ type: "ENDING_SOON", graceMs: ZERO_BALANCE_GRACE_MS });
      } else if (nowMs >= this.s.zeroDeadlineMs) {
        effects.push(...this.end(nowMs, "NO_BALANCE"));
      }
    } else if (this.s.zeroDeadlineMs !== null) {
      // Recarga no meio do aviso: cancela o encerramento programado.
      this.s.zeroDeadlineMs = null;
    }
    return effects;
  }
}
