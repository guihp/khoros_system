"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/admin/conteudo", label: "Visão geral", exact: true },
  { href: "/admin/conteudo/artigos", label: "Artigos" },
  { href: "/admin/conteudo/categorias", label: "Categorias" },
  { href: "/admin/conteudo/midia", label: "Mídia" },
  { href: "/admin/conteudo/paginas", label: "Páginas" },
] as const;

export function AdminConteudoNav() {
  const pathname = usePathname() ?? "";

  return (
    <nav className="mb-8 flex flex-wrap gap-2 border-b border-calm-200 pb-3" aria-label="Conteúdo">
      {LINKS.map((link) => {
        const active =
          "exact" in link && link.exact
            ? pathname === link.href
            : pathname === link.href || pathname.startsWith(`${link.href}/`);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={
              active
                ? "rounded-full bg-sage-600 px-3 py-1.5 text-sm font-medium text-white"
                : "rounded-full border border-calm-200 px-3 py-1.5 text-sm text-calm-800 hover:bg-calm-100"
            }
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function StatusBadge({ status }: { status: "DRAFT" | "PUBLISHED" }) {
  const published = status === "PUBLISHED";
  return (
    <span
      className={
        published
          ? "inline-flex rounded-full bg-sage-100 px-2.5 py-0.5 text-xs font-medium text-sage-600"
          : "inline-flex rounded-full bg-calm-100 px-2.5 py-0.5 text-xs font-medium text-calm-600"
      }
    >
      {published ? "Publicado" : "Rascunho"}
    </span>
  );
}
