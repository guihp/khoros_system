"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AdminGate, useAdminToken } from "@/components/admin/AdminGate";
import { AdminConteudoNav, StatusBadge } from "@/components/admin/AdminConteudoNav";
import { fetchApi, ApiError } from "@/lib/api";
import type { CmsListResponse, CmsPage } from "@/lib/cms-types";

function PagesList() {
  const token = useAdminToken();
  const [pages, setPages] = useState<CmsPage[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      const data = await fetchApi<CmsListResponse<CmsPage>>("/admin/cms/pages", { token });
      setPages(data.items);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível carregar as páginas.");
      setPages([]);
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <p className="text-sm text-calm-600">
        <Link href="/admin/conteudo" className="hover:text-brand-700">
          Conteúdo
        </Link>
        <span className="mx-1.5 text-calm-400">/</span>
        Páginas
      </p>
      <h1 className="mt-2 text-2xl font-semibold text-calm-900">Páginas</h1>
      <p className="mt-2 text-sm text-calm-600">
        Edite as seções tipadas das páginas de marketing (home, sobre, FAQ…).
      </p>

      <div className="mt-6">
        <AdminConteudoNav />
      </div>

      {error ? <p className="mt-2 text-sm text-red-700">{error}</p> : null}

      {pages === null ? (
        <p className="mt-8 text-sm text-calm-600">Carregando…</p>
      ) : pages.length === 0 ? (
        <p className="mt-8 text-sm text-calm-600">
          Nenhuma página cadastrada ainda. Rode o seed do CMS ou crie páginas via API.
        </p>
      ) : (
        <ul className="mt-4 flex flex-col gap-3">
          {pages.map((page) => (
            <li key={page.id}>
              <Link
                href={`/admin/conteudo/paginas/${page.slug}`}
                className="flex flex-col gap-2 rounded-card border border-calm-200 bg-white p-5 transition hover:border-sage-600/40 hover:bg-sage-100/30 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="text-base font-medium text-calm-900">{page.title}</p>
                  <p className="text-sm text-calm-600">
                    <span className="font-mono">{page.slug}</span>
                  </p>
                </div>
                <div className="flex flex-col gap-1 sm:items-end">
                  <StatusBadge status={page.status} />
                  <p className="text-xs text-calm-600">
                    Atualizado {new Date(page.updated_at).toLocaleDateString("pt-BR")}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

export default function AdminCmsPagesPage() {
  return (
    <AdminGate>
      <PagesList />
    </AdminGate>
  );
}
