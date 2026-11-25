import Link from "next/link";

/**
 * Banner de apoio permanente — exigência de conformidade (CFP).
 * Presente em TODAS as páginas via layout raiz. Nunca remover nem esconder.
 */
export function SupportBanner() {
  return (
    <aside
      aria-label="Apoio emocional imediato"
      className="w-full bg-brand-800 px-4 py-2 text-center text-[13px] text-brand-50"
    >
      Precisa de apoio agora? <strong>CVV 188</strong> (24h, gratuito) ·{" "}
      <a
        href="https://cvv.org.br"
        target="_blank"
        rel="noopener noreferrer"
        className="underline underline-offset-2 text-white hover:text-brand-100"
      >
        chat cvv.org.br
      </a>{" "}
      · Emergência: <strong>SAMU 192</strong> / <strong>190</strong> ·{" "}
      <Link href="/apoio" className="underline underline-offset-2 text-white hover:text-brand-100">
        mais recursos
      </Link>
    </aside>
  );
}
