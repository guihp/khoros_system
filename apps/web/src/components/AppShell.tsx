"use client";

import { usePathname } from "next/navigation";
import { AppNav } from "@/components/AppNav";

/** Rotas da sala de consulta (paciente `/sessao/:id` e psicólogo `/pro/sessao/:id`). */
const CALL_ROUTE_PATTERN = /^\/(pro\/)?sessao\//;

/** Rotas de marketing (blog Onda 0) — usam Header/Footer próprios. */
const MARKETING_ROUTE_PATTERN =
  /^\/$|^\/blog(\/|$)|^\/faq$|^\/como-funciona$|^\/sobre$|^\/politicas(\/|$)/;

/**
 * Envolve as páginas com a navegação e o rodapé padrão do site — exceto nas
 * rotas da sala de consulta (nav/rodapé competem com o vídeo) e nas rotas de
 * marketing (shell do blog). O banner de apoio (CFP) continua no layout raiz.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const path = pathname ?? "";
  const isCallRoute = CALL_ROUTE_PATTERN.test(path);
  const isMarketingRoute = MARKETING_ROUTE_PATTERN.test(path);

  if (isCallRoute || isMarketingRoute) {
    return <div className="flex-1 flex flex-col min-h-0">{children}</div>;
  }

  return (
    <>
      <AppNav />
      <div className="flex-1">{children}</div>
      <footer className="px-4 py-6 text-center text-xs text-calm-600 border-t border-calm-200">
        {/* Inscrição PJ no CRP e Responsável Técnico: valores vêm de platform_settings */}
        <p>KHOROS · Plataforma de psicologia por vídeo</p>
        <p className="mt-1">
          Pessoa jurídica inscrita no CRP · Responsável Técnico(a): a definir — CRP nº a definir
        </p>
        <p className="mt-1">
          Este serviço não substitui atendimento de urgência. Em crise, ligue{" "}
          <strong>CVV 188</strong> ou <strong>SAMU 192</strong>.
        </p>
      </footer>
    </>
  );
}
