"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AdminGate, useAdminToken } from "@/components/admin/AdminGate";
import { AdminConteudoNav, StatusBadge } from "@/components/admin/AdminConteudoNav";
import { fetchApi, ApiError } from "@/lib/api";
import type { CmsArticle, CmsCategory, CmsListResponse } from "@/lib/cms-types";
import type { CmsContentStatus } from "@khoros/shared";

function ArtigosList() {
  const token = useAdminToken();
  const [items, setItems] = useState<CmsArticle[] | null>(null);
  const [categories, setCategories] = useState<CmsCategory[]>([]);
  const [statusFilter, setStatusFilter] = useState<"" | CmsContentStatus>("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [actingId, setActingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    setError(null);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set("status", statusFilter);
      if (categoryFilter) params.set("categoryId", categoryFilter);
      const qs = params.toString();
      const [articles, cats] = await Promise.all([
        fetchApi<CmsListResponse<CmsArticle>>(`/admin/cms/articles${qs ? `?${qs}` : ""}`, { token }),
        fetchApi<CmsListResponse<CmsCategory>>("/admin/cms/categories", { token }),
      ]);
      setItems(articles.items);
      setCategories(cats.items);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível carregar os artigos.");
      setItems([]);
    }
  }, [token, statusFilter, categoryFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  async function publish(id: string) {
    if (!token) return;
    setActingId(id);
    setError(null);
    try {
      await fetchApi(`/admin/cms/articles/${id}`, {
        method: "PATCH",
        token,
        body: { status: "PUBLISHED" },
      });
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível publicar.");
    } finally {
      setActingId(null);
    }
  }

  async function remove(id: string, title: string) {
    if (!token) return;
    if (!window.confirm(`Apagar o artigo “${title}”? Esta ação não pode ser desfeita.`)) return;
    setActingId(id);
    setError(null);
    try {
      await fetchApi(`/admin/cms/articles/${id}`, { method: "DELETE", token });
      setItems((prev) => prev?.filter((a) => a.id !== id) ?? null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível apagar.");
    } finally {
      setActingId(null);
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <p className="text-sm text-calm-600">
        <Link href="/admin" className="hover:text-brand-700">
          Admin
        </Link>
        <span className="mx-1.5 text-calm-400">/</span>
        <Link href="/admin/conteudo" className="hover:text-brand-700">
          Conteúdo
        </Link>
        <span className="mx-1.5 text-calm-400">/</span>
        Artigos
      </p>
      <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-calm-900">Artigos</h1>
          <p className="mt-1 text-sm text-calm-600">Blog CMS — rascunhos e publicados.</p>
        </div>
        <Link
          href="/admin/conteudo/artigos/novo"
          className="rounded-full bg-sage-600 px-4 py-2 text-sm font-medium text-white hover:bg-sage-600/90"
        >
          Novo artigo
        </Link>
      </div>

      <div className="mt-6">
        <AdminConteudoNav />
      </div>

      <div className="mb-6 flex flex-wrap gap-3">
        <label className="text-sm text-calm-800">
          Status
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as "" | CmsContentStatus)}
            className="ml-2 rounded-lg border border-calm-200 bg-white px-2 py-1.5 text-sm"
          >
            <option value="">Todos</option>
            <option value="DRAFT">Rascunho</option>
            <option value="PUBLISHED">Publicado</option>
          </select>
        </label>
        <label className="text-sm text-calm-800">
          Categoria
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="ml-2 rounded-lg border border-calm-200 bg-white px-2 py-1.5 text-sm"
          >
            <option value="">Todas</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      {error && <p className="mb-4 text-sm text-red-700">{error}</p>}

      {items === null ? (
        <p className="text-sm text-calm-600">Carregando…</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-calm-600">Nenhum artigo encontrado.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((article) => (
            <div
              key={article.id}
              className="flex flex-col gap-3 rounded-card border border-calm-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate font-medium text-calm-900">{article.title}</p>
                  <StatusBadge status={article.status} />
                </div>
                <p className="mt-1 text-xs text-calm-600">
                  {article.category?.name ?? "Sem categoria"} · /{article.slug}
                  {article.updated_at
                    ? ` · ${new Date(article.updated_at).toLocaleDateString("pt-BR")}`
                    : ""}
                </p>
              </div>
              <div className="flex shrink-0 flex-wrap gap-2">
                <Link
                  href={`/admin/conteudo/artigos/${article.id}`}
                  className="rounded-full border border-calm-200 px-3 py-1.5 text-sm text-calm-800 hover:bg-calm-100"
                >
                  Editar
                </Link>
                {article.status !== "PUBLISHED" && (
                  <button
                    type="button"
                    disabled={actingId === article.id}
                    onClick={() => publish(article.id)}
                    className="rounded-full bg-sage-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-sage-600/90 disabled:opacity-60"
                  >
                    Publicar
                  </button>
                )}
                <button
                  type="button"
                  disabled={actingId === article.id}
                  onClick={() => remove(article.id, article.title)}
                  className="rounded-full border border-calm-200 px-3 py-1.5 text-sm text-red-700 hover:bg-calm-100 disabled:opacity-60"
                >
                  Apagar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}

export default function AdminArtigosPage() {
  return (
    <AdminGate>
      <ArtigosList />
    </AdminGate>
  );
}
