"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { AdminGate, useAdminToken } from "@/components/admin/AdminGate";
import { AdminConteudoNav, StatusBadge } from "@/components/admin/AdminConteudoNav";
import { ArticleForm } from "@/components/admin/ArticleForm";
import { fetchApi, ApiError } from "@/lib/api";
import type { CmsArticle, CmsArticleInput, CmsCategory, CmsListResponse, CmsMedia } from "@/lib/cms-types";

function EditarArtigo() {
  const token = useAdminToken();
  const router = useRouter();
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";

  const [article, setArticle] = useState<CmsArticle | null>(null);
  const [categories, setCategories] = useState<CmsCategory[]>([]);
  const [media, setMedia] = useState<CmsMedia[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token || !id) return;
    setLoading(true);
    setError(null);
    try {
      const [art, cats, mediaRes] = await Promise.all([
        fetchApi<CmsArticle>(`/admin/cms/articles/${id}`, { token }),
        fetchApi<CmsListResponse<CmsCategory>>("/admin/cms/categories", { token }),
        fetchApi<CmsListResponse<CmsMedia>>("/admin/cms/media", { token }),
      ]);
      setArticle(art);
      setCategories(cats.items);
      setMedia(mediaRes.items);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível carregar o artigo.");
      setArticle(null);
    } finally {
      setLoading(false);
    }
  }, [token, id]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleSubmit(value: CmsArticleInput) {
    if (!token || !id) return;
    setSubmitting(true);
    setSavedMsg(null);
    try {
      const updated = await fetchApi<CmsArticle>(`/admin/cms/articles/${id}`, {
        method: "PATCH",
        token,
        body: value,
      });
      setArticle(updated);
      setSavedMsg("Alterações salvas.");
    } catch (err) {
      throw err instanceof ApiError ? err : new Error("Não foi possível salvar.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!token || !article) return;
    if (!window.confirm(`Apagar o artigo “${article.title}”?`)) return;
    try {
      await fetchApi(`/admin/cms/articles/${id}`, { method: "DELETE", token });
      router.push("/admin/conteudo/artigos");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível apagar.");
    }
  }

  async function handlePublish() {
    if (!token || !id) return;
    setSubmitting(true);
    setError(null);
    try {
      const updated = await fetchApi<CmsArticle>(`/admin/cms/articles/${id}`, {
        method: "PATCH",
        token,
        body: { status: "PUBLISHED" },
      });
      setArticle(updated);
      setSavedMsg("Artigo publicado.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível publicar.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <p className="text-sm text-calm-600">
        <Link href="/admin/conteudo/artigos" className="hover:text-brand-700">
          ← Artigos
        </Link>
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold text-calm-900">Editar artigo</h1>
        {article && <StatusBadge status={article.status} />}
      </div>

      <div className="mt-6">
        <AdminConteudoNav />
      </div>

      {error && <p className="mb-4 text-sm text-red-700">{error}</p>}
      {savedMsg && <p className="mb-4 text-sm text-sage-600">{savedMsg}</p>}

      {loading ? (
        <p className="text-sm text-calm-600">Carregando…</p>
      ) : !article ? (
        <p className="text-sm text-calm-600">Artigo não encontrado.</p>
      ) : (
        <>
          <div className="mb-6 flex flex-wrap gap-2">
            {article.status !== "PUBLISHED" && (
              <button
                type="button"
                disabled={submitting}
                onClick={() => void handlePublish()}
                className="rounded-full bg-sage-600 px-4 py-2 text-sm font-medium text-white hover:bg-sage-600/90 disabled:opacity-60"
              >
                Publicar agora
              </button>
            )}
            <button
              type="button"
              onClick={() => void handleDelete()}
              className="rounded-full border border-calm-200 px-4 py-2 text-sm text-red-700 hover:bg-calm-100"
            >
              Apagar
            </button>
          </div>
          <ArticleForm
            key={article.id + article.updated_at}
            categories={categories}
            media={media}
            initial={article}
            submitting={submitting}
            submitLabel="Salvar alterações"
            adminToken={token}
            onMediaUploaded={(item) => setMedia((prev) => [item, ...prev.filter((m) => m.id !== item.id)])}
            onSubmit={handleSubmit}
          />
        </>
      )}
    </main>
  );
}

export default function AdminEditarArtigoPage() {
  return (
    <AdminGate>
      <EditarArtigo />
    </AdminGate>
  );
}
