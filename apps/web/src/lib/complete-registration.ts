import type { User } from "@supabase/supabase-js";
import type { UserRole } from "@khoros/shared";
import { fetchApi, ApiError } from "./api";
import { clearPendingRegistration, readPendingRegistration } from "./pending-registration";
import { createClient } from "./supabase/client";
import type { MeResponse } from "./api-types";

/** Home de cada papel, usada pela navegação e pelos guards de rota. */
export function roleHomePath(role: UserRole): string {
  if (role === "PSYCHOLOGIST") return "/pro";
  if (role === "ADMIN") return "/admin";
  return "/paciente";
}

/** Para onde mandar o usuário assim que o cadastro é concluído por completo. */
export function postRegisterRedirectPath(role: UserRole): string {
  if (role === "PATIENT") return "/consentimentos";
  return roleHomePath(role);
}

function extractPendingPayload(user: User): Record<string, unknown> | null {
  const metaPayload = user.user_metadata?.khoros_register;
  if (metaPayload && typeof metaPayload === "object") {
    return metaPayload as Record<string, unknown>;
  }
  return readPendingRegistration(user.email);
}

const inFlight = new Set<string>();

/**
 * Tenta concluir o cadastro pendente (guardado em `user_metadata.khoros_register`
 * do Auth ou, em backup, em localStorage por e-mail) quando `/me` retornou
 * `registered: false`. Idempotente e seguro contra corrida: se outra chamada já
 * concluiu o registro (ex.: AuthProvider e página de login disparando ao mesmo
 * tempo), o 409 ALREADY_REGISTERED é tratado como sucesso.
 *
 * Retorna o novo `/me` (registered: true) se completou algo, ou `null` se não
 * havia nada pendente ou a tentativa falhou.
 */
export async function completePendingRegistration(
  accessToken: string,
  user: User,
): Promise<MeResponse | null> {
  const payload = extractPendingPayload(user);
  if (!payload) return null;
  if (inFlight.has(user.id)) return null;
  inFlight.add(user.id);

  try {
    try {
      await fetchApi("/auth/register", { method: "POST", token: accessToken, body: payload });
    } catch (err) {
      if (!(err instanceof ApiError && err.status === 409)) {
        return null;
      }
    }

    clearPendingRegistration(user.email);
    if (user.user_metadata?.khoros_register) {
      try {
        await createClient().auth.updateUser({ data: { khoros_register: null } });
      } catch {
        // Limpeza de metadata é best-effort — não bloqueia o fluxo.
      }
    }

    return await fetchApi<MeResponse>("/me", { token: accessToken });
  } catch {
    return null;
  } finally {
    inFlight.delete(user.id);
  }
}
