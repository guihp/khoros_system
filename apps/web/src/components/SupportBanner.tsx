import Link from "next/link";

/**
 * Banner de apoio permanente — exigência de conformidade (CFP).
 * Presente em TODAS as páginas via layout raiz. Nunca remover nem esconder.
 */
export function SupportBanner() {
  return (
    <aside
      aria-label="Apoio emocional imediato"
      className="w-full bg-brand-50 border-b border-brand-200 px-4 py-2 text-center text-sm text-calm-800"
    >
      Precisa de apoio agora? <strong>CVV 188</strong> (24h, gratuito) ·{" "}
      <a
        href="https://cvv.org.br"
        target="_blank"
        rel="noopener noreferrer"
        className="underline text-brand-700 hover:text-brand-800"
      >
        chat cvv.org.br
      </a>{" "}
      · Emergência: <strong>SAMU 192</strong> / <strong>190</strong> ·{" "}
      <Link href="/apoio" className="underline text-brand-700 hover:text-brand-800">
        mais recursos
      </Link>
    </aside>
  );
}
