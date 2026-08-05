"use client";

import Link from "next/link";
import { AdminGate } from "@/components/admin/AdminGate";
import { AdminConteudoNav } from "@/components/admin/AdminConteudoNav";

const ITEMS = [
  {
    href: "/admin/conteudo/artigos",
    title: "Artigos",
    description: "Listar, criar, editar, publicar e apagar posts do blog.",
  },
  {
    href: "/admin/conteudo/categorias",
    title: "Categorias",
    description: "Organizar temas do blog (slug, descrição, ordem, status).",
  },
  {
    href: "/admin/conteudo/midia",
    title: "Mídia",
    description: "Biblioteca de imagens (upload JPEG, PNG, WebP ou AVIF).",
  },
  {
    href: "/admin/conteudo/paginas",
    title: "Páginas",
    description: "Editor de seções tipadas (hero, FAQ, CTAs, passos…).",
  },
] as const;

function ConteudoHub() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <p className="text-sm text-calm-600">
        <Link href="/admin" className="hover:text-brand-700">
          Admin
        </Link>
        <span className="mx-1.5 text-calm-400">/</span>
        Conteúdo
      </p>
      <h1 className="mt-2 text-2xl font-semibold text-calm-900">Conteúdo</h1>
      <p className="mt-2 text-sm text-calm-600">
        Gerencie o CMS do blog e das páginas públicas.
      </p>

      <div className="mt-6">
        <AdminConteudoNav />
      </div>

      <div className="flex flex-col gap-4">
        {ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="block rounded-card border border-calm-200 bg-white p-5 transition hover:border-sage-600/40 hover:bg-sage-100/40"
          >
            <p className="text-base font-medium text-calm-900">{item.title}</p>
            <p className="mt-1 text-sm text-calm-600">{item.description}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}

export default function AdminConteudoPage() {
  return (
    <AdminGate>
      <ConteudoHub />
    </AdminGate>
  );
}
