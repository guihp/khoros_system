"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import type { CmsContentStatus } from "@khoros/shared";
import { AdminGate, useAdminToken } from "@/components/admin/AdminGate";
import { AdminConteudoNav, StatusBadge } from "@/components/admin/AdminConteudoNav";
import { fetchApi, ApiError } from "@/lib/api";
import type { CmsCategory, CmsCategoryInput, CmsListResponse, CmsMedia } from "@/lib/cms-types";
import { slugify } from "@/lib/slugify";

const inputClass =
  "mt-1 w-full rounded-lg border border-calm-200 bg-white px-3 py-2 text-sm text-calm-900 outline-none focus:border-sage-600";

const emptyForm = (): CmsCategoryInput & { id?: string } => ({
  name: "",
  slug: "",
  description: "",
  position: 0,
  status: "DRAFT",
  imageMediaId: null,
  legacyImagePath: null,
});

function CategoriasCrud() {
  const token = useAdminToken();
  const [items, setItems] = useState<CmsCategory[] | null>(null);
  const [media, setMedia] = useState<CmsMedia[]>([]);
  const [form, setForm] = useState(emptyForm());
  const [slugTouched, setSlugTouched] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [actingId, setActingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      const [cats, mediaRes] = await Promise.all([
        fetchApi<CmsListResponse<CmsCategory>>("/admin/cms/categories", { token }),
        fetchApi<CmsListResponse<CmsMedia>>("/admin/cms/media", { token }),
      ]);
      setItems(cats.items);
      setMedia(mediaRes.items);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível carregar categorias.");
      setItems([]);
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  function startEdit(cat: CmsCategory) {
    setEditingId(cat.id);
    setSlugTouched(true);
    setForm({
      name: cat.name,
      slug: cat.slug,
      description: cat.description,
      position: cat.position,
      status: cat.status,
      imageMediaId: cat.image_media_id,
      legacyImagePath: cat.legacy_image_path,
    });
    setError(null);
  }

  function resetForm() {
    setEditingId(null);
    setSlugTouched(false);
    setForm(emptyForm());
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!token) return;
    setSubmitting(true);
    setError(null);
    const body = {
      name: form.name.trim(),
      slug: form.slug.trim(),
      description: form.description.trim(),
      position: form.position,
      status: form.status,
      imageMediaId: form.imageMediaId || null,
      legacyImagePath: form.legacyImagePath?.trim() || null,
    };
    try {
      if (editingId) {
        await fetchApi(`/admin/cms/categories/${editingId}`, {
          method: "PATCH",
          token,
          body,
        });
      } else {
        await fetchApi("/admin/cms/categories", {
          method: "POST",
          token,
          body,
        });
      }
      resetForm();
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível salvar.");
    } finally {
      setSubmitting(false);
    }
  }

  async function remove(id: string, name: string) {
    if (!token) return;
    if (!window.confirm(`Apagar a categoria “${name}”? Artigos vinculados podem falhar.`)) return;
    setActingId(id);
    setError(null);
    try {
      await fetchApi(`/admin/cms/categories/${id}`, { method: "DELETE", token });
      if (editingId === id) resetForm();
      await load();
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
        Categorias
      </p>
      <h1 className="mt-2 text-2xl font-semibold text-calm-900">Categorias</h1>
      <p className="mt-1 text-sm text-calm-600">Temas do blog — slug, ordem e status.</p>

      <div className="mt-6">
        <AdminConteudoNav />
      </div>

      {error && <p className="mb-4 text-sm text-red-700">{error}</p>}

      <form
        onSubmit={handleSubmit}
        className="mb-10 rounded-card border border-calm-200 bg-white p-5"
      >
        <h2 className="text-base font-medium text-calm-900">
          {editingId ? "Editar categoria" : "Nova categoria"}
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-medium text-calm-800">
            Nome
            <input
              required
              maxLength={120}
              value={form.name}
              onChange={(e) => {
                const name = e.target.value;
                setForm((f) => ({
                  ...f,
                  name,
                  slug: slugTouched ? f.slug : slugify(name),
                }));
              }}
              className={inputClass}
            />
          </label>
          <label className="block text-sm font-medium text-calm-800">
            Slug
            <input
              required
              pattern="^[a-z0-9]+(?:-[a-z0-9]+)*$"
              value={form.slug}
              onChange={(e) => {
                setSlugTouched(true);
                setForm((f) => ({ ...f, slug: e.target.value }));
              }}
              className={inputClass}
            />
          </label>
        </div>
        <label className="mt-4 block text-sm font-medium text-calm-800">
          Descrição
          <textarea
            required
            maxLength={1000}
            rows={3}
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            className={inputClass}
          />
        </label>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <label className="block text-sm font-medium text-calm-800">
            Posição
            <input
              type="number"
              min={0}
              value={form.position}
              onChange={(e) => setForm((f) => ({ ...f, position: Number(e.target.value) || 0 }))}
              className={inputClass}
            />
          </label>
          <label className="block text-sm font-medium text-calm-800">
            Status
            <select
              value={form.status}
              onChange={(e) =>
                setForm((f) => ({ ...f, status: e.target.value as CmsContentStatus }))
              }
              className={inputClass}
            >
              <option value="DRAFT">Rascunho</option>
              <option value="PUBLISHED">Publicado</option>
            </select>
          </label>
          <label className="block text-sm font-medium text-calm-800">
            Imagem (mídia)
            <select
              value={form.imageMediaId ?? ""}
              onChange={(e) =>
                setForm((f) => ({ ...f, imageMediaId: e.target.value || null }))
              }
              className={inputClass}
            >
              <option value="">Nenhuma</option>
              {media.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.alt_text}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className="mt-4 block text-sm font-medium text-calm-800">
          Path legado (opcional)
          <input
            maxLength={2048}
            value={form.legacyImagePath ?? ""}
            onChange={(e) =>
              setForm((f) => ({ ...f, legacyImagePath: e.target.value || null }))
            }
            className={inputClass}
          />
        </label>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="submit"
            disabled={submitting}
            className="rounded-full bg-sage-600 px-4 py-2 text-sm font-medium text-white hover:bg-sage-600/90 disabled:opacity-60"
          >
            {submitting ? "Salvando…" : editingId ? "Salvar" : "Criar"}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="rounded-full border border-calm-200 px-4 py-2 text-sm text-calm-800 hover:bg-calm-100"
            >
              Cancelar
            </button>
          )}
        </div>
      </form>

      {items === null ? (
        <p className="text-sm text-calm-600">Carregando…</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-calm-600">Nenhuma categoria ainda.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((cat) => (
            <div
              key={cat.id}
              className="flex flex-col gap-3 rounded-card border border-calm-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium text-calm-900">{cat.name}</p>
                  <StatusBadge status={cat.status} />
                  <span className="text-xs text-calm-600">pos. {cat.position}</span>
                </div>
                <p className="mt-1 text-xs text-calm-600">/{cat.slug}</p>
                <p className="mt-1 text-sm text-calm-600 line-clamp-2">{cat.description}</p>
              </div>
              <div className="flex shrink-0 gap-2">
                <button
                  type="button"
                  onClick={() => startEdit(cat)}
                  className="rounded-full border border-calm-200 px-3 py-1.5 text-sm text-calm-800 hover:bg-calm-100"
                >
                  Editar
                </button>
                <button
                  type="button"
                  disabled={actingId === cat.id}
                  onClick={() => remove(cat.id, cat.name)}
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

export default function AdminCategoriasPage() {
  return (
    <AdminGate>
      <CategoriasCrud />
    </AdminGate>
  );
}
