"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AdminGate, useAdminToken } from "@/components/admin/AdminGate";
import { AdminConteudoNav } from "@/components/admin/AdminConteudoNav";
import { ArticleForm } from "@/components/admin/ArticleForm";
import { fetchApi, ApiError } from "@/lib/api";
import type { CmsArticle, CmsArticleInput, CmsCategory, CmsListResponse, CmsMedia } from "@/lib/cms-types";

function NovoArtigo() {
  const token = useAdminToken();
  const router = useRouter();
  const [categories, setCategories] = useState<CmsCategory[]>([]);
  const [media, setMedia] = useState<CmsMedia[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMeta = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [cats, mediaRes] = await Promise.all([
        fetchApi<CmsListResponse<CmsCategory>>("/admin/cms/categories", { token }),
        fetchApi<CmsListResponse<CmsMedia>>("/admin/cms/media", { token }),
      ]);
      setCategories(cats.items);
      setMedia(mediaRes.items);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível carregar metadados.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void loadMeta();
  }, [loadMeta]);

  async function handleSubmit(value: CmsArticleInput) {
    if (!token) return;
    setSubmitting(true);
    try {
      const created = await fetchApi<CmsArticle>("/admin/cms/articles", {
        method: "POST",
        token,
        body: value,
      });
      router.push(`/admin/conteudo/artigos/${created.id}`);
    } catch (err) {
      setSubmitting(false);
      throw err instanceof ApiError ? err : new Error("Não foi possível criar o artigo.");
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <p className="text-sm text-calm-600">
        <Link href="/admin/conteudo/artigos" className="hover:text-brand-700">
          ← Artigos
        </Link>
      </p>
      <h1 className="mt-2 text-2xl font-semibold text-calm-900">Novo artigo</h1>
      <div className="mt-6">
        <AdminConteudoNav />
      </div>
      {error && <p className="mb-4 text-sm text-red-700">{error}</p>}
      {loading ? (
        <p className="text-sm text-calm-600">Carregando…</p>
      ) : categories.length === 0 ? (
        <p className="text-sm text-calm-600">
          Crie ao menos uma{" "}
          <Link href="/admin/conteudo/categorias" className="text-brand-700 underline">
            categoria
          </Link>{" "}
          antes de publicar artigos.
        </p>
      ) : (
        <ArticleForm
          categories={categories}
          media={media}
          submitting={submitting}
          submitLabel="Criar artigo"
          adminToken={token}
          onMediaUploaded={(item) => setMedia((prev) => [item, ...prev.filter((m) => m.id !== item.id)])}
          onSubmit={handleSubmit}
        />
      )}
    </main>
  );
}

export default function AdminNovoArtigoPage() {
  return (
    <AdminGate>
      <NovoArtigo />
    </AdminGate>
  );
}
