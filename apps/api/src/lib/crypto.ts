/**
 * Cifra de coluna (AES-256-GCM) para dados sensíveis persistidos como `bytea`
 * via PostgREST (Supabase): cpf_encrypted, hb_secret_encrypted, prontuário.
 *
 * Formato no banco: hex prefixado com `\x` (convenção PostgREST para bytea),
 * contendo iv(12) + authTag(16) + ciphertext.
 */

import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const IV_BYTES = 12;
const TAG_BYTES = 16;

export function loadEncryptionKey(hexKey: string): Buffer {
  const key = Buffer.from(hexKey, "hex");
  if (key.length !== 32) {
    throw new Error("COLUMN_ENCRYPTION_KEY deve ter 32 bytes (64 caracteres hex)");
  }
  return key;
}

/** Cifra texto e devolve string pronta para inserir numa coluna bytea via PostgREST. */
export function encryptToBytea(key: Buffer, plaintext: string): string {
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  const payload = Buffer.concat([iv, tag, ciphertext]);
  return `\\x${payload.toString("hex")}`;
}

/** Decifra o valor de uma coluna bytea (formato `\x...` ou hex puro) devolvido pelo PostgREST. */
export function decryptFromBytea(key: Buffer, pgBytea: string): string {
  const hex = pgBytea.startsWith("\\x") ? pgBytea.slice(2) : pgBytea;
  const payload = Buffer.from(hex, "hex");
  const iv = payload.subarray(0, IV_BYTES);
  const tag = payload.subarray(IV_BYTES, IV_BYTES + TAG_BYTES);
  const ciphertext = payload.subarray(IV_BYTES + TAG_BYTES);
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
}

/** Segredo aleatório para HMAC de heartbeat de uma sessão (32 bytes, hex). */
export function generateHeartbeatSecret(): string {
  return randomBytes(32).toString("hex");
}
