"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import type { CmsContentStatus } from "@khoros/shared";
import { AdminGate, useAdminToken } from "@/components/admin/AdminGate";
import { AdminConteudoNav, StatusBadge } from "@/components/admin/AdminConteudoNav";
import { fetchApi, uploadApiFile, ApiError } from "@/lib/api";
import { createClient } from "@/lib/supabase/client";
import type { CmsListResponse, CmsMedia } from "@/lib/cms-types";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function MidiaLibrary() {
  const token = useAdminToken();
  const [items, setItems] = useState<CmsMedia[] | null>(null);
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [altText, setAltText] = useState("");
  const [status, setStatus] = useState<CmsContentStatus>("DRAFT");
  const [uploading, setUploading] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      const data = await fetchApi<CmsListResponse<CmsMedia>>("/admin/cms/media", { token });
      setItems(data.items);

      const supabase = createClient();
      const next: Record<string, string> = {};
      await Promise.all(
        data.items.slice(0, 40).map(async (item) => {
          const { data: signed } = await supabase.storage
            .from("cms-media")
            .createSignedUrl(item.storage_path, 3600);
          if (signed?.signedUrl) next[item.id] = signed.signedUrl;
        }),
      );
      setPreviews(next);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível carregar a mídia.");
      setItems([]);
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleUpload(event: FormEvent) {
    event.preventDefault();
    if (!token || !file) return;
    if (!altText.trim()) {
      setError("Informe o texto alternativo (alt).");
      return;
    }
    setUploading(true);
    setError(null);
    try {
      await uploadApiFile("/admin/cms/media", file, token, "file", {
        altText: altText.trim(),
        status,
      });
      setFile(null);
      setAltText("");
      setStatus("DRAFT");
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Upload falhou.");
    } finally {
      setUploading(false);
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
        Mídia
      </p>
      <h1 className="mt-2 text-2xl font-semibold text-calm-900">Mídia</h1>
      <p className="mt-1 text-sm text-calm-600">
        JPEG, PNG, WebP ou AVIF · até 5 MB. Bucket privado <code className="text-xs">cms-media</code>.
      </p>

      <div className="mt-6">
        <AdminConteudoNav />
      </div>

      {error && <p className="mb-4 text-sm text-red-700">{error}</p>}

      <form
        onSubmit={handleUpload}
        className="mb-10 rounded-card border border-calm-200 bg-white p-5"
      >
        <h2 className="text-base font-medium text-calm-900">Enviar imagem</h2>
        <label className="mt-4 block text-sm font-medium text-calm-800">
          Arquivo
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            required
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="mt-1 block w-full text-sm text-calm-800 file:mr-3 file:rounded-full file:border-0 file:bg-sage-100 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-sage-600"
          />
        </label>
        <label className="mt-4 block text-sm font-medium text-calm-800">
          Texto alternativo
          <input
            required
            maxLength={500}
            value={altText}
            onChange={(e) => setAltText(e.target.value)}
            className="mt-1 w-full rounded-lg border border-calm-200 bg-white px-3 py-2 text-sm outline-none focus:border-sage-600"
          />
        </label>
        <label className="mt-4 block text-sm font-medium text-calm-800">
          Status
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as CmsContentStatus)}
            className="mt-1 w-full rounded-lg border border-calm-200 bg-white px-3 py-2 text-sm outline-none focus:border-sage-600 sm:max-w-xs"
          >
            <option value="DRAFT">Rascunho</option>
            <option value="PUBLISHED">Publicado</option>
          </select>
        </label>
        <button
          type="submit"
          disabled={uploading || !file}
          className="mt-4 rounded-full bg-sage-600 px-4 py-2 text-sm font-medium text-white hover:bg-sage-600/90 disabled:opacity-60"
        >
          {uploading ? "Enviando…" : "Enviar"}
        </button>
      </form>

      {items === null ? (
        <p className="text-sm text-calm-600">Carregando…</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-calm-600">Nenhuma mídia enviada.</p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {items.map((item) => (
            <li
              key={item.id}
              className="overflow-hidden rounded-card border border-calm-200 bg-white"
            >
              <div className="flex aspect-video items-center justify-center bg-calm-100">
                {previews[item.id] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={previews[item.id]}
                    alt={item.alt_text}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-xs text-calm-600">{item.mime_type}</span>
                )}
              </div>
              <div className="p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-medium text-calm-900">{item.alt_text}</p>
                  <StatusBadge status={item.status} />
                </div>
                <p className="mt-1 truncate text-xs text-calm-600">{item.storage_path}</p>
                <p className="mt-0.5 text-xs text-calm-600">
                  {formatBytes(item.size_bytes)} ·{" "}
                  {new Date(item.created_at).toLocaleDateString("pt-BR")}
                </p>
                <p className="mt-1 font-mono text-[10px] text-calm-400">{item.id}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

export default function AdminMidiaPage() {
  return (
    <AdminGate>
      <MidiaLibrary />
    </AdminGate>
  );
}
