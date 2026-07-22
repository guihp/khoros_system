import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

/**
 * Cliente Supabase para Server Components / Route Handlers.
 * Lê/escreve cookies de sessão; em Server Components puros a escrita é
 * silenciosamente ignorada (Next só permite setar cookies em Server Actions
 * ou Route Handlers) — comportamento esperado do padrão @supabase/ssr.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Chamado de um Server Component — ignorar (sessão é refrescada no middleware/client).
          }
        },
      },
    },
  );
}
