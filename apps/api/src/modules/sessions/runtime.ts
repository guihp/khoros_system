/**
 * SessionRuntime — orquestra o ciclo de vida completo de uma sessão (slices 4+5):
 * "Falar agora" → PENDING (hold + lock + LiveKit) → aceite → ACTIVE (BillingEngine
 * + heartbeats WS) → ENDED (débito final, HOLD_RELEASE, split, libera lock/presença).
 *
 * Este módulo é o ÚNICO lugar que aplica os `Effect`s do BillingEngine (puro,
 * em billing/engine.ts) contra o mundo real: Postgres (ledger/sessions via
 * Supabase service role), Redis/memória (lock do psicólogo) e WS (push aos
 * dois lados). O motor em si não é reescrito — só é instanciado e alimentado.
 */

import { randomUUID } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { AccessToken } from "livekit-server-sdk";
import {
  CALL_ACCEPT_TIMEOUT_MS,
  HEARTBEAT_INTERVAL_MS,
  MIN_SESSION_MINUTES,
  type EndReason,
  type SessionServerEvent,
} from "@khoros/shared";
import { BillingEngine, type Effect, type Participant } from "../billing/engine.js";
import { HeartbeatValidator } from "../billing/heartbeat.js";
import { acquirePsychologistLock, releasePsychologistLock, type AtomicKV } from "../presence/lock.js";
import type { Env } from "../../config.js";
import { decryptFromBytea, encryptToBytea, generateHeartbeatSecret, loadEncryptionKey } from "../../lib/crypto.js";

/** Contrato mínimo de socket usado pelo runtime — compatível estruturalmente com `ws`. */
export interface SessionSocket {
  send(data: string): void;
  close(code?: number, reason?: string): void;
  on(event: string, listener: (...args: unknown[]) => void): void;
}

interface RuntimeEntry {
  id: string;
  patientId: string;
  psychologistId: string;
  pricePerMinuteCents: number;
  takeRate: number;
  livekitRoom: string;
  hbSecret: string;
  /** Total já movido para saldo_reservado (hold inicial + reforços por recarga em ACTIVE). */
  holdCents: number;
  phase: "PENDING" | "ACTIVE" | "ENDED";
  acceptTimer?: NodeJS.Timeout;
  tickTimer?: NodeJS.Timeout;
  engine?: BillingEngine;
  validator?: HeartbeatValidator;
}

export type StartSessionResult =
  | {
      ok: true;
      sessionId: string;
      livekitRoom: string;
      livekitUrl: string;
      patientToken: string;
      acceptTimeoutMs: number;
      /** Segredo HMAC desta sessão — o cliente precisa dele para assinar os heartbeats via WS. */
      hbSecret: string;
    }
  | { ok: false; status: number; code: string; message: string };

// eslint-disable-next-line @typescript-eslint/ban-types
export type ActionResult<T extends object = {}> =
  | ({ ok: true } & T)
  | { ok: false; status: number; code: string; message: string };

export interface StartSessionInput {
  patientId: string;
  psychologistId: string;
  screeningId: string;
  ip?: string;
}

export class SessionRuntime {
  private readonly sessions = new Map<string, RuntimeEntry>();
  private readonly connections = new Map<string, Set<SessionSocket>>();
  private readonly encryptionKey: Buffer;

  constructor(
    private readonly supabase: SupabaseClient,
    private readonly kv: AtomicKV,
    private readonly env: Env,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private readonly logger: { warn: (...args: any[]) => void; error: (...args: any[]) => void },
  ) {
    this.encryptionKey = loadEncryptionKey(env.COLUMN_ENCRYPTION_KEY);
  }

  // ── WebSocket registry ────────────────────────────────────────────────────

  registerConnection(userId: string, socket: SessionSocket): void {
    const set = this.connections.get(userId) ?? new Set<SessionSocket>();
    set.add(socket);
    this.connections.set(userId, set);
  }

  unregisterConnection(userId: string, socket: SessionSocket): void {
    const set = this.connections.get(userId);
    if (!set) return;
    set.delete(socket);
    if (set.size === 0) this.connections.delete(userId);
  }

  push(userId: string, event: SessionServerEvent): void {
    const set = this.connections.get(userId);
    if (!set) return;
    const payload = JSON.stringify(event);
    for (const socket of set) {
      try {
        socket.send(payload);
      } catch (err) {
        this.logger.warn({ err, userId }, "falha ao enviar evento WS");
      }
    }
  }

  // ── Consultas auxiliares ──────────────────────────────────────────────────

  isPsychologistBusy(psychologistId: string): boolean {
    for (const entry of this.sessions.values()) {
      if (entry.psychologistId === psychologistId && entry.phase !== "ENDED") return true;
    }
    return false;
  }

  findActiveSessionForPatient(patientId: string): RuntimeEntry | undefined {
    for (const entry of this.sessions.values()) {
      if (entry.patientId === patientId && entry.phase === "ACTIVE") return entry;
    }
    return undefined;
  }

  /** Recarga confirmada em pleno andamento de sessão: reforça o hold e o orçamento do motor. */
  async notifyWalletCredit(userId: string, amountCents: number, paymentRef?: string): Promise<void> {
    const entry = this.findActiveSessionForPatient(userId);
    if (!entry?.engine) return;
    const key = `sess:${entry.id}:hold:topup:${paymentRef ?? Date.now()}`;
    const { error } = await this.supabase.from("ledger_entries").insert({
      wallet_id: userId,
      tipo: "HOLD",
      valor_centavos: -amountCents,
      session_id: entry.id,
      idempotency_key: key,
      metadata: { reforco: true },
    });
    if (error && (error as { code?: string }).code !== "23505") {
      this.logger.error({ err: error }, "falha ao reforçar hold após recarga em sessão ativa");
      return;
    }
    entry.holdCents += amountCents;
    entry.engine.increaseBudget(amountCents);
  }

  // ── "Falar agora" ─────────────────────────────────────────────────────────

  async startSession(input: StartSessionInput): Promise<StartSessionResult> {
    const { patientId, psychologistId, screeningId } = input;

    // 1) Consentimentos vigentes.
    const consentCheck = await this.checkConsents(patientId);
    if (!consentCheck.ok) {
      return { ok: false, status: 403, code: "CONSENT_REQUIRED", message: consentCheck.message };
    }

    // 2) Triagem de crise desta tentativa.
    const { data: screening } = await this.supabase
      .from("crisis_screenings")
      .select("id, patient_id, resultado, session_id, created_at")
      .eq("id", screeningId)
      .maybeSingle();
    if (!screening || screening.patient_id !== patientId) {
      return { ok: false, status: 400, code: "SCREENING_NOT_FOUND", message: "Triagem não encontrada." };
    }
    if (screening.resultado !== "OK") {
      return {
        ok: false,
        status: 403,
        code: "CRISIS_BLOCKED",
        message: "Esta triagem indicou risco e bloqueia o início da consulta.",
      };
    }
    if (screening.session_id) {
      return { ok: false, status: 400, code: "SCREENING_ALREADY_USED", message: "Triagem já utilizada." };
    }
    const screeningAgeMs = Date.now() - new Date(screening.created_at).getTime();
    if (screeningAgeMs > 15 * 60_000) {
      return { ok: false, status: 400, code: "SCREENING_EXPIRED", message: "Triagem expirada, refaça antes de iniciar." };
    }

    // 3) Psicólogo apto.
    const { data: psy } = await this.supabase
      .from("psychologist_profiles")
      .select("user_id, crp_status, disponibilidade, preco_por_minuto_centavos, take_rate, recebedor_gateway_id")
      .eq("user_id", psychologistId)
      .maybeSingle();
    if (!psy) {
      return { ok: false, status: 404, code: "PSYCHOLOGIST_NOT_FOUND", message: "Psicólogo não encontrado." };
    }
    if (psy.crp_status !== "VERIFIED") {
      return { ok: false, status: 403, code: "PSYCHOLOGIST_NOT_VERIFIED", message: "Psicólogo ainda não verificado." };
    }
    const asaasIsPlaceholder = this.env.ASAAS_API_KEY.startsWith("FALTA");
    const devBypassRecebedor = this.env.NODE_ENV === "development" && asaasIsPlaceholder;
    if (!psy.recebedor_gateway_id && !devBypassRecebedor) {
      return {
        ok: false,
        status: 403,
        code: "PSYCHOLOGIST_NO_RECEIVER",
        message: "Psicólogo ainda não concluiu o onboarding financeiro.",
      };
    }
    if (psy.disponibilidade !== "AVAILABLE") {
      return { ok: false, status: 409, code: "PSYCHOLOGIST_UNAVAILABLE", message: "Psicólogo não está disponível agora." };
    }

    // 4) Saldo mínimo.
    const { data: wallet } = await this.supabase
      .from("wallets")
      .select("saldo_centavos")
      .eq("user_id", patientId)
      .maybeSingle();
    const freeBalance = wallet?.saldo_centavos ?? 0;
    const minRequired = MIN_SESSION_MINUTES * psy.preco_por_minuto_centavos;
    if (freeBalance < minRequired) {
      return {
        ok: false,
        status: 402,
        code: "INSUFFICIENT_BALANCE",
        message: `Saldo insuficiente: mínimo de ${minRequired} centavos (${MIN_SESSION_MINUTES} min) para iniciar.`,
      };
    }

    // 5) Lock atômico do psicólogo (corrida entre pacientes).
    const sessionId = randomUUID();
    const lockAcquired = await acquirePsychologistLock(this.kv, psychologistId, sessionId);
    if (!lockAcquired) {
      return { ok: false, status: 409, code: "PSYCHOLOGIST_JUST_BUSY", message: "Psicólogo acabou de ficar ocupado." };
    }

    try {
      const livekitRoom = `khoros-${sessionId}`;
      const hbSecret = generateHeartbeatSecret();

      const { error: sessionError } = await this.supabase.from("sessions").insert({
        id: sessionId,
        patient_id: patientId,
        psychologist_id: psychologistId,
        status: "PENDING",
        preco_por_minuto_snapshot: psy.preco_por_minuto_centavos,
        take_rate_snapshot: psy.take_rate,
        livekit_room: livekitRoom,
        hb_secret_encrypted: encryptToBytea(this.encryptionKey, hbSecret),
      });
      if (sessionError) throw new Error(`insert sessions: ${sessionError.message}`);

      const holdCents = freeBalance;
      const { error: holdError } = await this.supabase.from("ledger_entries").insert({
        wallet_id: patientId,
        tipo: "HOLD",
        valor_centavos: -holdCents,
        session_id: sessionId,
        idempotency_key: `sess:${sessionId}:hold`,
        metadata: {},
      });
      if (holdError) throw new Error(`insert hold: ${holdError.message}`);

      await this.supabase.from("crisis_screenings").update({ session_id: sessionId }).eq("id", screeningId);
      await this.supabase.from("psychologist_profiles").update({ disponibilidade: "BUSY" }).eq("user_id", psychologistId);

      const entry: RuntimeEntry = {
        id: sessionId,
        patientId,
        psychologistId,
        pricePerMinuteCents: psy.preco_por_minuto_centavos,
        takeRate: Number(psy.take_rate),
        livekitRoom,
        hbSecret,
        holdCents,
        phase: "PENDING",
      };
      entry.acceptTimer = setTimeout(() => {
        void this.cancelPending(entry, "PSY_NO_ANSWER");
      }, CALL_ACCEPT_TIMEOUT_MS);
      this.sessions.set(sessionId, entry);

      const patientToken = await this.mintLiveKitToken({
        room: livekitRoom,
        identity: patientId,
        name: "paciente",
        ttlSeconds: Math.ceil(CALL_ACCEPT_TIMEOUT_MS / 1000) + 3600,
      });

      const { data: patientRow } = await this.supabase
        .from("users")
        .select("public_nickname, full_name")
        .eq("id", patientId)
        .maybeSingle();
      const { data: patientPrefs } = await this.supabase
        .from("patient_profiles")
        .select("mostrar_nome_real")
        .eq("user_id", patientId)
        .maybeSingle();
      const useRealName = patientPrefs?.mostrar_nome_real === true;
      const patientNickname = useRealName
        ? (patientRow?.full_name ?? patientRow?.public_nickname ?? "Paciente")
        : (patientRow?.public_nickname ?? patientRow?.full_name ?? "Paciente");
      this.push(psychologistId, {
        type: "incoming_call",
        sessionId,
        patientNickname,
        timeoutMs: CALL_ACCEPT_TIMEOUT_MS,
      });

      return {
        ok: true,
        sessionId,
        livekitRoom,
        livekitUrl: this.env.LIVEKIT_URL,
        patientToken,
        acceptTimeoutMs: CALL_ACCEPT_TIMEOUT_MS,
        hbSecret,
      };
    } catch (err) {
      await releasePsychologistLock(this.kv, psychologistId, sessionId);
      this.sessions.delete(sessionId);
      this.logger.error({ err }, "falha ao iniciar sessão");
      return { ok: false, status: 500, code: "START_FAILED", message: "Falha ao iniciar sessão." };
    }
  }

  // ── Aceite / recusa / cancelamento ────────────────────────────────────────

  async acceptSession(
    sessionId: string,
    psychologistId: string,
  ): Promise<ActionResult<{ psychologistToken: string; livekitRoom: string; livekitUrl: string; hbSecret: string }>> {
    const entry = this.sessions.get(sessionId);
    if (!entry || entry.psychologistId !== psychologistId) {
      return { ok: false, status: 404, code: "NOT_FOUND", message: "Sessão não encontrada." };
    }
    if (entry.phase !== "PENDING") {
      return { ok: false, status: 409, code: "INVALID_PHASE", message: "Sessão não está mais pendente." };
    }
    if (entry.acceptTimer) clearTimeout(entry.acceptTimer);

    const startedAtMs = Date.now();
    await this.supabase
      .from("sessions")
      .update({ status: "ACTIVE", started_at: new Date(startedAtMs).toISOString() })
      .eq("id", sessionId);

    entry.engine = new BillingEngine({
      sessionId,
      pricePerMinuteCents: entry.pricePerMinuteCents,
      takeRate: entry.takeRate,
      budgetCents: entry.holdCents,
      startedAtMs,
    });
    entry.validator = new HeartbeatValidator(entry.hbSecret, sessionId);
    entry.phase = "ACTIVE";
    entry.tickTimer = setInterval(() => this.tick(sessionId), HEARTBEAT_INTERVAL_MS);

    this.push(entry.patientId, { type: "session_state", status: "ACTIVE", paidSeconds: 0, accruedCents: 0 });

    const psychologistToken = await this.mintLiveKitToken({
      room: entry.livekitRoom,
      identity: psychologistId,
      name: "psicologo",
      ttlSeconds: 4 * 3600,
    });

    return {
      ok: true,
      psychologistToken,
      livekitRoom: entry.livekitRoom,
      livekitUrl: this.env.LIVEKIT_URL,
      hbSecret: entry.hbSecret,
    };
  }

  async declineSession(sessionId: string, psychologistId: string): Promise<ActionResult> {
    const entry = this.sessions.get(sessionId);
    if (!entry || entry.psychologistId !== psychologistId) {
      return { ok: false, status: 404, code: "NOT_FOUND", message: "Sessão não encontrada." };
    }
    if (entry.phase !== "PENDING") {
      return { ok: false, status: 409, code: "INVALID_PHASE", message: "Sessão não está mais pendente." };
    }
    await this.cancelPending(entry, "PSY_NO_ANSWER");
    return { ok: true };
  }

  private async cancelPending(entry: RuntimeEntry, reason: EndReason): Promise<void> {
    if (entry.phase !== "PENDING") return;
    if (entry.acceptTimer) clearTimeout(entry.acceptTimer);
    entry.phase = "ENDED";
    this.sessions.delete(entry.id);

    await this.supabase
      .from("sessions")
      .update({ status: "CANCELLED", ended_at: new Date().toISOString(), motivo_encerramento: reason })
      .eq("id", entry.id);

    if (entry.holdCents > 0) {
      await this.supabase.from("ledger_entries").insert({
        wallet_id: entry.patientId,
        tipo: "HOLD_RELEASE",
        valor_centavos: entry.holdCents,
        session_id: entry.id,
        idempotency_key: `sess:${entry.id}:hold_release`,
        metadata: {},
      });
    }

    await releasePsychologistLock(this.kv, entry.psychologistId, entry.id);
    await this.supabase.from("psychologist_profiles").update({ disponibilidade: "AVAILABLE" }).eq("user_id", entry.psychologistId);

    this.push(entry.patientId, { type: "session_cancelled", reason });
    this.push(entry.psychologistId, { type: "session_cancelled", reason });
  }

  // ── Encerramento por participante ─────────────────────────────────────────

  async endSession(sessionId: string, byUserId: string): Promise<ActionResult> {
    const entry = this.sessions.get(sessionId);
    if (!entry) {
      return { ok: false, status: 404, code: "NOT_FOUND", message: "Sessão não encontrada ou já encerrada." };
    }
    if (byUserId !== entry.patientId && byUserId !== entry.psychologistId) {
      return { ok: false, status: 403, code: "FORBIDDEN", message: "Você não participa desta sessão." };
    }

    if (entry.phase === "PENDING") {
      const reason: EndReason = byUserId === entry.psychologistId ? "PSY_NO_ANSWER" : "PATIENT_ENDED";
      await this.cancelPending(entry, reason);
      return { ok: true };
    }

    if (entry.phase === "ACTIVE" && entry.engine) {
      const reason: EndReason = byUserId === entry.patientId ? "PATIENT_ENDED" : "PSY_ENDED";
      const effects = entry.engine.end(Date.now(), reason);
      await this.applyEffects(entry, effects);
      return { ok: true };
    }

    return { ok: false, status: 409, code: "ALREADY_ENDED", message: "Sessão já encerrada." };
  }

  // ── Heartbeat ──────────────────────────────────────────────────────────────

  async handleHeartbeat(userId: string, msg: { sessionId: string; seq: number; hmac: string }): Promise<void> {
    const entry = this.sessions.get(msg.sessionId);
    if (!entry || entry.phase !== "ACTIVE" || !entry.engine || !entry.validator) return;

    const participant: Participant | null =
      userId === entry.patientId ? "patient" : userId === entry.psychologistId ? "psychologist" : null;
    if (!participant) return;

    const validation = entry.validator.validate(userId, msg.seq, msg.hmac);
    if (!validation.ok) {
      await this.supabase.from("audit_log").insert({
        actor_id: userId,
        acao: `HEARTBEAT_REJECTED_${validation.rejection}`,
        entidade: "sessions",
        entidade_id: entry.id,
        metadata: { seq: msg.seq },
      });
      return;
    }

    const effects = entry.engine.recordBeat(participant, Date.now());
    await this.applyEffects(entry, effects);
  }

  private tick(sessionId: string): void {
    const entry = this.sessions.get(sessionId);
    if (!entry || entry.phase !== "ACTIVE" || !entry.engine) return;
    const effects = entry.engine.tick(Date.now());
    void this.applyEffects(entry, effects);
  }

  // ── Aplicação dos efeitos do motor ────────────────────────────────────────

  private async applyEffects(entry: RuntimeEntry, effects: Effect[]): Promise<void> {
    for (const effect of effects) {
      switch (effect.type) {
        case "DEBIT_MINUTE": {
          const { error } = await this.supabase.from("ledger_entries").insert({
            wallet_id: entry.patientId,
            tipo: "DEBITO_SESSAO",
            valor_centavos: effect.amountCents,
            session_id: entry.id,
            idempotency_key: effect.idempotencyKey,
            metadata: { unit: effect.unit },
          });
          if (error && (error as { code?: string }).code !== "23505") {
            this.logger.error({ err: error }, "falha ao debitar minuto");
          }
          const snap = entry.engine!.snapshot();
          const event: SessionServerEvent = {
            type: "session_state",
            status: "ACTIVE",
            paidSeconds: Math.floor(snap.coveredSeconds),
            accruedCents: snap.debitedUnits * entry.pricePerMinuteCents,
          };
          this.push(entry.patientId, event);
          this.push(entry.psychologistId, event);
          break;
        }
        case "WARN_LOW_BALANCE": {
          const event: SessionServerEvent = { type: "low_balance", remainingMinutes: effect.remainingMinutes };
          this.push(entry.patientId, event);
          this.push(entry.psychologistId, event);
          break;
        }
        case "WARN_CRITICAL_BALANCE": {
          const event: SessionServerEvent = { type: "critical_balance", remainingMinutes: effect.remainingMinutes };
          this.push(entry.patientId, event);
          this.push(entry.psychologistId, event);
          break;
        }
        case "ENDING_SOON": {
          const event: SessionServerEvent = { type: "ending_soon", reason: "NO_BALANCE", graceMs: effect.graceMs };
          this.push(entry.patientId, event);
          this.push(entry.psychologistId, event);
          break;
        }
        case "SUSPENDED": {
          await this.supabase.from("sessions").update({ status: "SUSPENDED" }).eq("id", entry.id);
          break;
        }
        case "RESUMED": {
          await this.supabase.from("sessions").update({ status: "ACTIVE" }).eq("id", entry.id);
          break;
        }
        case "ENDED": {
          await this.finalizeEnded(entry, effect);
          break;
        }
      }
    }
  }

  private async finalizeEnded(entry: RuntimeEntry, effect: Extract<Effect, { type: "ENDED" }>): Promise<void> {
    if (entry.tickTimer) clearInterval(entry.tickTimer);
    entry.phase = "ENDED";
    this.sessions.delete(entry.id);

    const remainderCents = entry.holdCents - effect.totalCents;
    if (remainderCents > 0) {
      const { error } = await this.supabase.from("ledger_entries").insert({
        wallet_id: entry.patientId,
        tipo: "HOLD_RELEASE",
        valor_centavos: remainderCents,
        session_id: entry.id,
        idempotency_key: `sess:${entry.id}:hold_release`,
        metadata: {},
      });
      if (error && (error as { code?: string }).code !== "23505") {
        this.logger.error({ err: error }, "falha ao liberar hold restante");
      }
    }

    await this.supabase
      .from("sessions")
      .update({
        status: "ENDED",
        ended_at: new Date().toISOString(),
        segundos_cobrados: effect.paidSeconds,
        valor_total_centavos: effect.totalCents,
        valor_psicologo_centavos: effect.psychologistCents,
        valor_plataforma_centavos: effect.platformCents,
        motivo_encerramento: effect.reason,
      })
      .eq("id", entry.id);

    await releasePsychologistLock(this.kv, entry.psychologistId, entry.id);
    await this.supabase.from("psychologist_profiles").update({ disponibilidade: "AVAILABLE" }).eq("user_id", entry.psychologistId);

    const event: SessionServerEvent = {
      type: "session_ended",
      reason: effect.reason,
      paidSeconds: effect.paidSeconds,
      totalCents: effect.totalCents,
    };
    this.push(entry.patientId, event);
    this.push(entry.psychologistId, event);
  }

  // ── Auxiliares ─────────────────────────────────────────────────────────────

  private async checkConsents(patientId: string): Promise<{ ok: true } | { ok: false; message: string }> {
    const { data: settings } = await this.supabase
      .from("platform_settings")
      .select("key, value")
      .in("key", ["versao_termo_consentimento", "versao_termo_lgpd"]);
    const versaoTermo = String(settings?.find((s) => s.key === "versao_termo_consentimento")?.value ?? "");
    const versaoLgpd = String(settings?.find((s) => s.key === "versao_termo_lgpd")?.value ?? "");

    const { data: consents } = await this.supabase
      .from("consents")
      .select("tipo, versao")
      .eq("user_id", patientId);
    const has = (tipo: string, versao: string) => (consents ?? []).some((c) => c.tipo === tipo && c.versao === versao);

    if (!has("TERMO_CONSENTIMENTO", versaoTermo) || !has("LGPD", versaoLgpd)) {
      return { ok: false, message: "Termo de consentimento e/ou LGPD pendentes de aceite." };
    }

    const { data: patientProfile } = await this.supabase
      .from("patient_profiles")
      .select("data_nascimento")
      .eq("user_id", patientId)
      .maybeSingle();
    if (patientProfile) {
      const age = this.calculateAge(patientProfile.data_nascimento);
      if (age < 18 && !(consents ?? []).some((c) => c.tipo === "RESPONSAVEL_LEGAL")) {
        return { ok: false, message: "Paciente menor de idade requer consentimento do responsável legal." };
      }
    }
    return { ok: true };
  }

  private calculateAge(birthDateISO: string, nowMs = Date.now()): number {
    const birth = new Date(birthDateISO);
    const now = new Date(nowMs);
    let age = now.getUTCFullYear() - birth.getUTCFullYear();
    const monthDiff = now.getUTCMonth() - birth.getUTCMonth();
    if (monthDiff < 0 || (monthDiff === 0 && now.getUTCDate() < birth.getUTCDate())) age -= 1;
    return age;
  }

  private async mintLiveKitToken(params: { room: string; identity: string; name: string; ttlSeconds: number }): Promise<string> {
    const at = new AccessToken(this.env.LIVEKIT_API_KEY, this.env.LIVEKIT_API_SECRET, {
      identity: params.identity,
      name: params.name,
      ttl: params.ttlSeconds,
    });
    at.addGrant({ room: params.room, roomJoin: true, canPublish: true, canSubscribe: true });
    return at.toJwt();
  }

  /**
   * Roda uma vez no boot: sessões que ficaram PENDING/ACTIVE/SUSPENDED no
   * banco mas não têm entrada no runtime (processo anterior morreu — crash
   * ou restart) são encerradas por ERROR, com devolução best-effort do que
   * estava reservado (nunca cobra o que não sabe ter acontecido). Psicólogos
   * travados em BUSY sem sessão correspondente voltam para AVAILABLE.
   */
  async reconcileOnBoot(): Promise<void> {
    const { data: stale } = await this.supabase
      .from("sessions")
      .select("id, patient_id")
      .in("status", ["PENDING", "ACTIVE", "SUSPENDED"]);

    for (const s of stale ?? []) {
      if (this.sessions.has(s.id)) continue;
      await this.supabase
        .from("sessions")
        .update({ status: "ENDED", ended_at: new Date().toISOString(), motivo_encerramento: "ERROR" })
        .eq("id", s.id);

      const { data: wallet } = await this.supabase
        .from("wallets")
        .select("saldo_reservado_centavos")
        .eq("user_id", s.patient_id)
        .maybeSingle();
      const reserved = wallet?.saldo_reservado_centavos ?? 0;
      if (reserved > 0) {
        await this.supabase.from("ledger_entries").insert({
          wallet_id: s.patient_id,
          tipo: "HOLD_RELEASE",
          valor_centavos: reserved,
          session_id: s.id,
          idempotency_key: `sess:${s.id}:hold_release:boot`,
          metadata: { reconciliation: true },
        });
      }
    }

    await this.supabase.from("psychologist_profiles").update({ disponibilidade: "AVAILABLE" }).eq("disponibilidade", "BUSY");

    if (stale && stale.length > 0) {
      this.logger.warn({ count: stale.length }, "reconciliação no boot: sessões órfãs encerradas (ERROR)");
    }
  }

  /**
   * Credenciais LiveKit + hbSecret para um participante. Preferência: estado
   * em memória; fallback: decifra hb_secret do banco e reminta o token.
   */
  async getParticipantCredentials(
    sessionId: string,
    userId: string,
  ): Promise<{ livekitToken: string; hbSecret: string; livekitRoom: string } | null> {
    const entry = this.sessions.get(sessionId);
    let hbSecret = entry?.hbSecret;
    let livekitRoom = entry?.livekitRoom;
    let patientId = entry?.patientId;
    let psychologistId = entry?.psychologistId;

    if (!entry) {
      const { data } = await this.supabase
        .from("sessions")
        .select("patient_id, psychologist_id, livekit_room, hb_secret_encrypted, status")
        .eq("id", sessionId)
        .maybeSingle();
      if (!data || data.status === "ENDED" || data.status === "CANCELLED") return null;
      if (data.patient_id !== userId && data.psychologist_id !== userId) return null;
      try {
        hbSecret = decryptFromBytea(this.encryptionKey, data.hb_secret_encrypted as string);
      } catch {
        return null;
      }
      livekitRoom = data.livekit_room;
      patientId = data.patient_id;
      psychologistId = data.psychologist_id;
    } else if (entry.patientId !== userId && entry.psychologistId !== userId) {
      return null;
    }

    if (!hbSecret || !livekitRoom || !patientId || !psychologistId) return null;

    const livekitToken = await this.mintLiveKitToken({
      room: livekitRoom,
      identity: userId,
      name: userId === psychologistId ? "psicologo" : "paciente",
      ttlSeconds: 4 * 3600,
    });

    return { livekitToken, hbSecret, livekitRoom };
  }

  /** Exposto para o webhook do LiveKit (antifraude: cruzar heartbeat com sala real). */
  getRoomForSession(sessionId: string): string | undefined {
    return this.sessions.get(sessionId)?.livekitRoom;
  }

  hasSession(sessionId: string): boolean {
    return this.sessions.has(sessionId);
  }
}
