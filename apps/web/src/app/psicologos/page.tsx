"use client";

/**
 * `/psicologos` foi substituído pelo cardápio em `/paciente` (paciente) e pelo
 * painel em `/pro` (psicólogo). Mantido como alias para não quebrar links
 * antigos (favoritos, e-mails, etc.) — só redireciona.
 */

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { roleHomePath } from "@/lib/complete-registration";

export default function PsicologosRedirectPage() {
  const { me, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    router.replace(me?.registered ? roleHomePath(me.role) : "/paciente");
  }, [loading, me, router]);

  return <main className="mx-auto max-w-lg px-4 py-16 text-center text-calm-600">Redirecionando…</main>;
}
