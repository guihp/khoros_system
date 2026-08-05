"use client";

import Link from "next/link";
import { useEffect } from "react";
import { CrisisResources } from "@/components/marketing/CrisisResources";

/**
 * Fallback do marketing quando o CMS falha (API fora do ar, conteúdo sem seed).
 * Não fingimos que o site está vazio: a rota responde erro (não indexa) e o
 * visitante continua com navegação e canais de apoio à vista.
 */
export default function MarketingError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Marketing render falhou:", error);
  }, [error]);

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-16">
      <h1 className="text-2xl sm:text-3xl font-bold font-serif mb-3">
        Conteúdo temporariamente indisponível
      </h1>
      <p className="text-khoros-slate mb-8">
        Não conseguimos carregar esta página agora. Já estamos verificando — tente
        novamente em alguns instantes.
      </p>

      <div className="flex flex-wrap gap-3 mb-12">
        <button
          type="button"
          onClick={reset}
          className="rounded-lg bg-khoros-cyan-dark px-4 py-2 text-sm font-medium text-white"
        >
          Tentar novamente
        </button>
        <Link
          href="/"
          className="rounded-lg border border-border px-4 py-2 text-sm font-medium"
        >
          Ir para a página inicial
        </Link>
      </div>

      <CrisisResources variant="inline" />
    </div>
  );
}
