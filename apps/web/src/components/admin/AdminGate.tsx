"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { roleHomePath } from "@/lib/complete-registration";

/**
 * Guard leve para páginas /admin/* — só ADMIN.
 * Espelha o padrão da fila CRP original.
 */
export function AdminGate({ children }: { children: ReactNode }) {
  const { me, loading: authLoading, session } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (authLoading) return;
    if (me?.registered && me.role !== "ADMIN") {
      router.replace(roleHomePath(me.role));
    }
  }, [authLoading, me, router]);

  if (authLoading) {
    return <main className="mx-auto max-w-lg px-4 py-16 text-calm-600">Carregando…</main>;
  }

  if (me?.registered && me.role !== "ADMIN") {
    return <main className="mx-auto max-w-lg px-4 py-16 text-calm-600">Redirecionando…</main>;
  }

  if (!session?.access_token) {
    return (
      <main className="mx-auto max-w-lg px-4 py-16 text-calm-600">
        Entre com uma conta de administrador para continuar.
      </main>
    );
  }

  return <>{children}</>;
}

export function useAdminToken(): string | null {
  const { session } = useAuth();
  return session?.access_token ?? null;
}
