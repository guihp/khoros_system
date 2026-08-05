"use client";

import Link from "next/link";
import { AdminGate } from "@/components/admin/AdminGate";

const SECTIONS = [
  {
    href: "/admin/crp",
    title: "Verificação de CRP",
    description: "Aprovar ou rejeitar inscrição de psicólogos antes de atender.",
  },
  {
    href: "/admin/conteudo",
    title: "Conteúdo",
    description: "Artigos, categorias, mídia e páginas do marketing / blog.",
  },
] as const;

function AdminHub() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-semibold text-calm-900">Administração</h1>
      <p className="mt-2 text-sm text-calm-600">
        Área restrita a administradores. Escolha uma seção para continuar.
      </p>

      <div className="mt-8 flex flex-col gap-4">
        {SECTIONS.map((section) => (
          <Link
            key={section.href}
            href={section.href}
            className="block rounded-card border border-calm-200 bg-white p-5 transition hover:border-sage-600/40 hover:bg-sage-100/40"
          >
            <p className="text-base font-medium text-calm-900">{section.title}</p>
            <p className="mt-1 text-sm text-calm-600">{section.description}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}

export default function AdminPage() {
  return (
    <AdminGate>
      <AdminHub />
    </AdminGate>
  );
}
