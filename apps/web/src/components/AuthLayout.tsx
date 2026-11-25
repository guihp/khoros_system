import Image from "next/image";

/**
 * Moldura das telas de entrada/cadastro: painel de marca à esquerda (desktop)
 * e cartão do formulário à direita.
 */
export function AuthLayout({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10 sm:py-16">
      <div className="grid overflow-hidden rounded-[2rem] bg-white ring-1 ring-calm-200 shadow-[var(--shadow-lift)] lg:grid-cols-[0.9fr_1.1fr]">
        <aside className="relative hidden lg:flex flex-col justify-between bg-gradient-to-br from-brand-600 to-brand-800 p-10 text-white">
          <Image
            src="/brand/logo-horizontal-white.png"
            alt="KHOROS tecnologia"
            width={1465}
            height={400}
            className="h-10 w-auto self-start"
          />
          <Image
            src="/brand/butterfly-white.png"
            alt=""
            aria-hidden
            width={600}
            height={420}
            className="mx-auto w-3/4 opacity-90 animate-drift-slow"
          />
          <div>
            <p className="font-display text-2xl font-semibold leading-snug">
              Cuidado com a sua saúde emocional, com sigilo e respeito.
            </p>
            <p className="mt-3 text-sm text-brand-100">
              Psicólogos(as) identificados(as) com CRP ativo · Sessões não são gravadas · LGPD
            </p>
          </div>
        </aside>

        <div className="px-6 py-10 sm:px-12 sm:py-14">
          <h1 className="text-3xl font-semibold text-calm-900">{title}</h1>
          {subtitle && <p className="mt-2 text-calm-600">{subtitle}</p>}
          <div className="mt-8">{children}</div>
        </div>
      </div>
    </main>
  );
}
