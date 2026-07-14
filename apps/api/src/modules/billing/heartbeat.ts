/**
 * Validação de heartbeats na borda (antes de chegarem ao motor).
 *
 * Antifraude:
 *  · HMAC-SHA256 com segredo exclusivo da sessão — cliente sem o segredo não
 *    fabrica beat; segredo entregue por canal autenticado no início.
 *  · `seq` estritamente crescente por participante — replay é descartado.
 *  · NENHUM timestamp do cliente é aceito: o payload não tem campo de tempo,
 *    e o servidor carimba o instante do recebimento.
 */

import { createHmac, timingSafeEqual } from "node:crypto";

export function signHeartbeat(secret: string, sessionId: string, userId: string, seq: number): string {
  return createHmac("sha256", secret).update(`${sessionId}:${userId}:${seq}`).digest("hex");
}

export type BeatRejection = "BAD_HMAC" | "REPLAYED_SEQ";

export interface BeatValidationResult {
  ok: boolean;
  rejection?: BeatRejection;
}

export class HeartbeatValidator {
  private lastSeq = new Map<string, number>();

  constructor(
    private readonly secret: string,
    private readonly sessionId: string,
  ) {}

  validate(userId: string, seq: number, hmacHex: string): BeatValidationResult {
    const expected = signHeartbeat(this.secret, this.sessionId, userId, seq);
    const given = Buffer.from(hmacHex, "hex");
    const want = Buffer.from(expected, "hex");
    if (given.length !== want.length || !timingSafeEqual(given, want)) {
      return { ok: false, rejection: "BAD_HMAC" };
    }
    const last = this.lastSeq.get(userId) ?? -1;
    if (seq <= last) {
      return { ok: false, rejection: "REPLAYED_SEQ" };
    }
    this.lastSeq.set(userId, seq);
    return { ok: true };
  }
}
