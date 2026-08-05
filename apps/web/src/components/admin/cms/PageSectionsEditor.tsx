"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import type { CmsSection, CmsSectionType } from "@khoros/shared";
import { AdminGate, useAdminToken } from "@/components/admin/AdminGate";
import { AdminConteudoNav, StatusBadge } from "@/components/admin/AdminConteudoNav";
import { SectionConfigForm } from "@/components/admin/cms/SectionConfigForm";
import {
  defaultSectionConfig,
  SECTION_TYPE_LABELS,
  sectionTypeOptions,
} from "@/components/admin/cms/section-registry";
import { fetchApi, ApiError } from "@/lib/api";
import type { CmsListResponse, CmsPage, CmsPageSection } from "@/lib/cms-types";

interface PageSectionsEditorProps {
  slug: string;
}

export function PageSectionsEditor({ slug }: PageSectionsEditorProps) {
  const token = useAdminToken();
  const [page, setPage] = useState<CmsPage | null>(null);
  const [sections, setSections] = useState<CmsPageSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actingId, setActingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [addType, setAddType] = useState<CmsSectionType>("hero");
  const [adding, setAdding] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const pages = await fetchApi<CmsListResponse<CmsPage>>("/admin/cms/pages", { token });
      const found = pages.items.find((item) => item.slug === slug) ?? null;
      if (!found) {
        setPage(null);
        setSections([]);
        setError("Página não encontrada.");
        return;
      }
      const sectionRes = await fetchApi<CmsListResponse<CmsPageSection>>(
        `/admin/cms/pages/${found.id}/sections`,
        { token },
      );
      const sorted = [...sectionRes.items].sort((a, b) => a.position - b.position);
      setPage(found);
      setSections(sorted);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível carregar a página.");
      setPage(null);
      setSections([]);
    } finally {
      setLoading(false);
    }
  }, [slug, token]);

  useEffect(() => {
    void load();
  }, [load]);

  async function reorder(nextOrder: CmsPageSection[]) {
    if (!token || !page) return;
    setActingId("reorder");
    setError(null);
    const previous = sections;
    setSections(nextOrder);
    try {
      await fetchApi(`/admin/cms/pages/${page.id}/sections/reorder`, {
        method: "PUT",
        token,
        body: { sectionIds: nextOrder.map((s) => s.id) },
      });
    } catch (err) {
      setSections(previous);
      setError(err instanceof ApiError ? err.message : "Não foi possível reordenar.");
    } finally {
      setActingId(null);
    }
  }

  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= sections.length) return;
    const next = [...sections];
    const [item] = next.splice(index, 1);
    next.splice(target, 0, item);
    void reorder(next.map((section, position) => ({ ...section, position })));
  }

  async function toggleVisible(section: CmsPageSection) {
    if (!token) return;
    setActingId(section.id);
    setError(null);
    try {
      const updated = await fetchApi<CmsPageSection>(`/admin/cms/sections/${section.id}`, {
        method: "PATCH",
        token,
        body: { isVisible: !section.is_visible },
      });
      setSections((prev) => prev.map((row) => (row.id === section.id ? updated : row)));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível alterar a visibilidade.");
    } finally {
      setActingId(null);
    }
  }

  async function saveConfig(section: CmsPageSection, config: CmsSection["config"]) {
    if (!token) return;
    setActingId(section.id);
    setError(null);
    try {
      const updated = await fetchApi<CmsPageSection>(`/admin/cms/sections/${section.id}`, {
        method: "PATCH",
        token,
        body: { type: section.type, config },
      });
      setSections((prev) => prev.map((row) => (row.id === section.id ? updated : row)));
      setEditingId(null);
    } catch (err) {
      throw err instanceof ApiError ? err : new Error("Não foi possível salvar a seção.");
    } finally {
      setActingId(null);
    }
  }

  async function removeSection(section: CmsPageSection) {
    if (!token) return;
    if (!window.confirm(`Remover a seção “${SECTION_TYPE_LABELS[section.type]}”?`)) return;
    setActingId(section.id);
    setError(null);
    try {
      await fetchApi(`/admin/cms/sections/${section.id}`, {
        method: "DELETE",
        token,
      });
      const remaining = sections.filter((row) => row.id !== section.id);
      setSections(remaining);
      setEditingId((id) => (id === section.id ? null : id));
      if (remaining.length > 0 && page) {
        await fetchApi(`/admin/cms/pages/${page.id}/sections/reorder`, {
          method: "PUT",
          token,
          body: { sectionIds: remaining.map((s) => s.id) },
        });
        setSections(remaining.map((row, position) => ({ ...row, position })));
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível remover a seção.");
      await load();
    } finally {
      setActingId(null);
    }
  }

  async function addSection() {
    if (!token || !page) return;
    setAdding(true);
    setError(null);
    try {
      const created = await fetchApi<CmsPageSection>(`/admin/cms/pages/${page.id}/sections`, {
        method: "POST",
        token,
        body: {
          type: addType,
          config: defaultSectionConfig(addType),
          position: sections.length,
          isVisible: true,
        },
      });
      setSections((prev) => [...prev, created]);
      setEditingId(created.id);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível adicionar a seção.");
    } finally {
      setAdding(false);
    }
  }

  async function publishPage() {
    if (!token || !page) return;
    setActingId("publish");
    setError(null);
    try {
      const updated = await fetchApi<CmsPage>(`/admin/cms/pages/${page.id}`, {
        method: "PATCH",
        token,
        body: { status: "PUBLISHED" },
      });
      setPage(updated);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível publicar a página.");
    } finally {
      setActingId(null);
    }
  }

  if (loading) {
    return <p className="mt-8 text-sm text-calm-600">Carregando seções…</p>;
  }

  if (!page) {
    return (
      <div className="mt-8 space-y-4">
        {error ? <p className="text-sm text-red-700">{error}</p> : null}
        <Link href="/admin/conteudo/paginas" className="text-sm font-medium text-sage-600 hover:underline">
          ← Voltar às páginas
        </Link>
      </div>
    );
  }

  const busy = actingId !== null || adding;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-calm-600">
          <Link href="/admin/conteudo/paginas" className="font-medium text-sage-600 hover:underline">
            Páginas
          </Link>
          <span className="mx-1.5 text-calm-400">/</span>
          <span className="font-mono text-calm-800">{page.slug}</span>
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-calm-900">{page.title}</h1>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-calm-600">
          <StatusBadge status={page.status} />
          {page.published_at ? (
            <span>publicado em {new Date(page.published_at).toLocaleDateString("pt-BR")}</span>
          ) : null}
          {page.status !== "PUBLISHED" ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => void publishPage()}
              className="rounded-full bg-sage-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-sage-600/90 disabled:opacity-60"
            >
              Publicar página
            </button>
          ) : null}
        </div>
      </div>

      {error ? <p className="text-sm text-red-700">{error}</p> : null}

      <div className="rounded-card border border-calm-200 bg-white p-4 sm:p-5">
        <p className="text-sm font-medium text-calm-900">Adicionar seção</p>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
          <select
            className="w-full rounded-lg border border-calm-200 bg-white px-3 py-2 text-sm text-calm-900 sm:max-w-xs"
            value={addType}
            disabled={busy}
            onChange={(e) => setAddType(e.target.value as CmsSectionType)}
          >
            {sectionTypeOptions().map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            disabled={busy}
            onClick={() => void addSection()}
            className="rounded-full bg-sage-600 px-4 py-2 text-sm font-medium text-white hover:bg-sage-600/90 disabled:opacity-60"
          >
            {adding ? "Adicionando…" : "Adicionar"}
          </button>
        </div>
      </div>

      {sections.length === 0 ? (
        <p className="text-sm text-calm-600">Nenhuma seção nesta página. Adicione a primeira acima.</p>
      ) : (
        <ul className="flex flex-col gap-4">
          {sections.map((section, index) => {
            const isEditing = editingId === section.id;
            const rowBusy = actingId === section.id || actingId === "reorder";
            return (
              <li
                key={section.id}
                className="rounded-card border border-calm-200 bg-white p-4 sm:p-5"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-base font-medium text-calm-900">
                      {index + 1}. {SECTION_TYPE_LABELS[section.type]}
                    </p>
                    <p className="mt-0.5 text-xs text-calm-600">
                      tipo <span className="font-mono">{section.type}</span>
                      {" · "}
                      {section.is_visible ? "visível" : "oculta"}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={busy || index === 0}
                      onClick={() => move(index, -1)}
                      className="rounded-full border border-calm-200 px-3 py-1.5 text-xs font-medium text-calm-800 hover:bg-calm-100 disabled:opacity-40"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      disabled={busy || index === sections.length - 1}
                      onClick={() => move(index, 1)}
                      className="rounded-full border border-calm-200 px-3 py-1.5 text-xs font-medium text-calm-800 hover:bg-calm-100 disabled:opacity-40"
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void toggleVisible(section)}
                      className="rounded-full border border-calm-200 px-3 py-1.5 text-xs font-medium text-calm-800 hover:bg-calm-100 disabled:opacity-60"
                    >
                      {section.is_visible ? "Ocultar" : "Mostrar"}
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => setEditingId(isEditing ? null : section.id)}
                      className="rounded-full border border-calm-200 px-3 py-1.5 text-xs font-medium text-calm-800 hover:bg-calm-100 disabled:opacity-60"
                    >
                      {isEditing ? "Fechar" : "Editar"}
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void removeSection(section)}
                      className="rounded-full border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-60"
                    >
                      Apagar
                    </button>
                  </div>
                </div>

                {isEditing ? (
                  <div className="mt-4 border-t border-calm-200 pt-4">
                    <SectionConfigForm
                      key={section.id + section.updated_at}
                      type={section.type}
                      initialConfig={section.config}
                      saving={rowBusy}
                      onCancel={() => setEditingId(null)}
                      onSave={(config) => saveConfig(section, config)}
                    />
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

/** Shell com guard + nav para a rota de detalhe. */
export function PageSectionsEditorPage({ slug }: { slug: string }) {
  return (
    <AdminGate>
      <main className="mx-auto max-w-3xl px-4 py-10">
        <AdminConteudoNav />
        <PageSectionsEditor slug={slug} />
      </main>
    </AdminGate>
  );
}
