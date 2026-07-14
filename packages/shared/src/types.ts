/** Enums e tipos de domínio compartilhados entre web e api. Espelham as enums do Postgres. */

export type UserRole = "PATIENT" | "PSYCHOLOGIST" | "ADMIN";
export type UserStatus = "ACTIVE" | "SUSPENDED" | "DELETED";

export type CrpStatus = "PENDING" | "VERIFIED" | "REJECTED" | "REVOKED";
export type Availability = "AVAILABLE" | "BUSY" | "OFFLINE";

export type SessionStatus = "PENDING" | "ACTIVE" | "SUSPENDED" | "ENDED" | "CANCELLED";

export type EndReason =
  | "PATIENT_ENDED"
  | "PSY_ENDED"
  | "NO_BALANCE"
  | "TIMEOUT_RECONNECT"
  | "PSY_NO_ANSWER"
  | "ADMIN"
  | "ERROR";

export type LedgerType =
  | "RECARGA"
  | "HOLD"
  | "HOLD_RELEASE"
  | "DEBITO_SESSAO"
  | "REEMBOLSO"
  | "REPASSE"
  | "COMISSAO"
  | "AJUSTE_ADMIN";

export type ConsentType = "TERMO_CONSENTIMENTO" | "LGPD" | "RESPONSAVEL_LEGAL";
export type ScreeningResult = "OK" | "BLOQUEADO";
export type PayoutStatus = "PENDING" | "SENT" | "CONFIRMED" | "FAILED";

/** Eventos WebSocket servidor → cliente durante uma sessão. */
export type SessionServerEvent =
  | { type: "session_state"; status: SessionStatus; paidSeconds: number; accruedCents: number }
  | { type: "low_balance"; remainingMinutes: number }
  | { type: "critical_balance"; remainingMinutes: number }
  | { type: "ending_soon"; reason: "NO_BALANCE"; graceMs: number }
  | { type: "session_ended"; reason: EndReason; paidSeconds: number; totalCents: number }
  | { type: "incoming_call"; sessionId: string; patientNickname: string; timeoutMs: number };

/** Heartbeat cliente → servidor. Timestamps do cliente são ignorados de propósito. */
export interface HeartbeatMessage {
  type: "heartbeat";
  sessionId: string;
  /** Sequencial monotônico por participante; replay/regressão = fraude. */
  seq: number;
  /** HMAC-SHA256(hb_secret, `${sessionId}:${userId}:${seq}`), hex. */
  hmac: string;
}
