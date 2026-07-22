/**
 * Cliente Supabase server-side (service role / secret key).
 *
 * TODA escrita no banco passa por aqui — nunca pelo pg/DATABASE_URL em runtime
 * (a senha do banco pode nem estar configurada; a API não depende dela).
 * RLS é contornada de propósito: a API é o único caminho de escrita.
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Env } from "../config.js";

export function createServiceClient(env: Env): SupabaseClient {
  return createClient(env.SUPABASE_URL, env.SUPABASE_SECRET_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
