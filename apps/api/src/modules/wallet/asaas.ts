/**
 * Cliente Asaas (sandbox real — nunca mock). Usado só para recarga Pix
 * (slice 3). Split/repasse ao psicólogo (slice 7) fica para depois.
 *
 * Enquanto ASAAS_API_KEY começar com "FALTA" (placeholder do .env), o
 * chamador deve tratar `AsaasNotConfiguredError` e responder 503 — nunca
 * simular confirmação de pagamento.
 */

import type { Env } from "../../config.js";

export class AsaasNotConfiguredError extends Error {
  constructor() {
    super("ASAAS_API_KEY não configurada (placeholder). Pagamentos Pix indisponíveis.");
  }
}

export class AsaasApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

function assertConfigured(env: Env): void {
  if (env.ASAAS_API_KEY.startsWith("FALTA")) {
    throw new AsaasNotConfiguredError();
  }
}

async function asaasFetch<T>(env: Env, path: string, init?: RequestInit): Promise<T> {
  assertConfigured(env);
  const res = await fetch(`${env.ASAAS_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      access_token: env.ASAAS_API_KEY,
      ...(init?.headers ?? {}),
    },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message =
      Array.isArray((body as { errors?: Array<{ description?: string }> }).errors) &&
      (body as { errors: Array<{ description?: string }> }).errors[0]?.description
        ? (body as { errors: Array<{ description?: string }> }).errors[0]!.description!
        : `Asaas respondeu ${res.status}`;
    throw new AsaasApiError(res.status, message);
  }
  return body as T;
}

export interface AsaasCustomer {
  id: string;
  name: string;
  email?: string;
  cpfCnpj?: string;
}

/** Busca cliente Asaas pela `externalReference` (id do usuário KHOROS) ou cria um novo. */
export async function ensureAsaasCustomer(
  env: Env,
  params: { userId: string; name: string; email: string; cpfCnpj?: string | undefined },
): Promise<AsaasCustomer> {
  const found = await asaasFetch<{ data: AsaasCustomer[] }>(
    env,
    `/customers?externalReference=${encodeURIComponent(params.userId)}`,
  );
  if (found.data.length > 0) return found.data[0]!;

  return asaasFetch<AsaasCustomer>(env, "/customers", {
    method: "POST",
    body: JSON.stringify({
      name: params.name,
      email: params.email,
      cpfCnpj: params.cpfCnpj,
      externalReference: params.userId,
    }),
  });
}

export interface AsaasPixCharge {
  id: string;
  status: string;
  value: number;
  invoiceUrl: string;
}

export interface AsaasPixQrCode {
  encodedImage: string;
  payload: string;
  expirationDate: string;
}

/** Cria cobrança Pix (billingType PIX) e devolve QR + copia-e-cola. */
export async function createPixCharge(
  env: Env,
  params: { customerId: string; valueCents: number; description: string; externalReference: string },
): Promise<{ charge: AsaasPixCharge; qrCode: AsaasPixQrCode }> {
  const dueDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const charge = await asaasFetch<AsaasPixCharge>(env, "/payments", {
    method: "POST",
    body: JSON.stringify({
      customer: params.customerId,
      billingType: "PIX",
      value: params.valueCents / 100,
      dueDate,
      description: params.description,
      externalReference: params.externalReference,
    }),
  });
  const qrCode = await asaasFetch<AsaasPixQrCode>(env, `/payments/${charge.id}/pixQrCode`);
  return { charge, qrCode };
}
