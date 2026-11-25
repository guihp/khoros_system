"use client";

import { APP_PREFIXES, matchesPrefix } from "@/lib/hosts";
import { usePathname } from "next/navigation";
import { AppNav } from "@/components/AppNav";

/** Rotas da sala de consulta (paciente `/sessao/:id` e psicólogo `/pro/sessao/:id`). */
const CALL_ROUTE_PATTERN = /^\/(pro\/)?sessao\//;

/**
 * Só as rotas do sistema usam a nav do app. Todo o resto é site/blog (com
 * Header/Footer próprios) — inclusive as URLs do blog. que chegam reescritas
 * pelo middleware, cujo pathname no navegador não tem o prefixo /blog.
 */
const APP_SHELL_PREFIXES = [...APP_PREFIXES, "/apoio"];

/**
 * Envolve as páginas com a navegação e o rodapé padrão do site — exceto nas
 * rotas da sala de consulta (nav/rodapé competem com o vídeo) e nas rotas de
 * marketing (shell do blog). O banner de apoio (CFP) continua no layout raiz.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const path = pathname ?? "";
  const isCallRoute = CALL_ROUTE_PATTERN.test(path);
  const isMarketingRoute = !matchesPrefix(path, APP_SHELL_PREFIXES);

  if (isCallRoute || isMarketingRoute) {
    return <div className="flex-1 flex flex-col min-h-0">{children}</div>;
  }

  return (
    <>
      <AppNav />
      <div className="flex-1 bg-calm-50">{children}</div>
      <footer className="mt-12 border-t border-calm-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-8 text-xs text-calm-500 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            {/* Inscrição PJ no CRP e Responsável Técnico: valores vêm de platform_settings */}
            <p className="font-medium text-calm-700">KHOROS tecnologia · Psicologia online</p>
            <p className="mt-1">
              Pessoa jurídica inscrita no CRP · Responsável Técnico(a): a definir — CRP nº a definir
            </p>
          </div>
          <p className="sm:text-right">
            Não substitui atendimento de urgência. Em crise: <strong className="text-calm-700">CVV 188</strong> ·{" "}
            <strong className="text-calm-700">SAMU 192</strong>
          </p>
        </div>
      </footer>
    </>
  );
}
