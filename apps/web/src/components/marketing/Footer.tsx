import Image from "next/image";
import Link from "next/link";
import { siteConfig } from "@/lib/blog/site";
import { CrisisResources } from "./CrisisResources";

const COLUMNS = [
  {
    title: "Conteúdo",
    links: [
      { href: "/blog", label: "Blog" },
      { href: "/como-funciona", label: "Como funciona" },
      { href: "/sobre", label: "Sobre a KHOROS" },
      { href: "/faq", label: "Perguntas frequentes" },
    ],
  },
  {
    title: "Políticas",
    links: [
      { href: "/politicas/privacidade", label: "Privacidade (LGPD)" },
      { href: "/politicas/termos", label: "Termos de uso" },
      { href: "/politicas/aviso", label: "Aviso de conteúdo" },
      { href: "/apoio", label: "Recursos de apoio" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="mt-auto bg-brand-900 text-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-16 pb-10">
        <div className="grid gap-12 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <Image
              src="/brand/logo-horizontal-white.png"
              alt={siteConfig.name}
              width={1465}
              height={400}
              className="h-11 w-auto object-contain mb-5"
            />
            <p className="text-sm text-white/70 leading-relaxed max-w-sm">{siteConfig.description}</p>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.title}>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-200 mb-4">
                {col.title}
              </p>
              <ul className="space-y-2.5 text-sm">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="text-white/75 hover:text-white transition-colors">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 rounded-2xl bg-white/[0.06] ring-1 ring-white/10 p-5">
          <CrisisResources variant="footer" />
        </div>

        <div className="mt-10 pt-8 border-t border-white/10 text-xs text-white/50 space-y-2">
          <p>{siteConfig.disclaimer}</p>
          <p className="italic">{siteConfig.goldenRule}</p>
          <p>© {new Date().getFullYear()} KHOROS tecnologia. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  );
}
