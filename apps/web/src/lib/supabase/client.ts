import { createBrowserClient } from "@supabase/ssr";

/**
 * Cliente Supabase para uso no browser. Usa a chave publishable (sb_publishable_…),
 * segura para exposição no front. Nunca a chave secreta aqui.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}
