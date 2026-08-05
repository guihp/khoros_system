"use client";

import { useEffect, useState, type FormEvent } from "react";
import type { CmsContentStatus } from "@khoros/shared";
import { uploadApiFile, ApiError } from "@/lib/api";
import { createClient } from "@/lib/supabase/client";
import type { CmsArticle, CmsArticleFaqItem, CmsArticleInput, CmsCategory, CmsMedia } from "@/lib/cms-types";
import { slugify } from "@/lib/slugify";

const inputClass =
  "mt-1 w-full rounded-lg border border-calm-200 bg-white px-3 py-2 text-sm text-calm-900 outline-none focus:border-sage-600";
const labelClass = "block text-sm font-medium text-calm-800";

type ArticleFormProps = {
  categories: CmsCategory[];
  media: CmsMedia[];
  initial?: CmsArticle | null;
  submitting: boolean;
  submitLabel: string;
  /** Token admin para upload inline de mídia. */
  adminToken?: string | null;
  /** Atualiza a lista de mídia no parent após upload. */
  onMediaUploaded?: (item: CmsMedia) => void;
  onSubmit: (value: CmsArticleInput) => Promise<void>;
};

function emptyFaq(): CmsArticleFaqItem {
  return { question: "", answer: "" };
}

export function ArticleForm({
  categories,
  media,
  initial,
  submitting,
  submitLabel,
  adminToken,
  onMediaUploaded,
  onSubmit,
}: ArticleFormProps) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(initial?.slug));
  const [categoryId, setCategoryId] = useState(initial?.category_id ?? categories[0]?.id ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [bodyMdx, setBodyMdx] = useState(initial?.body_mdx ?? "");
  const [status, setStatus] = useState<CmsContentStatus>(initial?.status ?? "DRAFT");
  const [author, setAuthor] = useState(initial?.author ?? "");
  const [reviewer, setReviewer] = useState(initial?.reviewer ?? "");
  const [reviewerCrp, setReviewerCrp] = useState(initial?.reviewer_crp ?? "");
  const [heroMediaId, setHeroMediaId] = useState(initial?.hero_media_id ?? "");
  const [legacyImagePath, setLegacyImagePath] = useState(initial?.legacy_image_path ?? "");
  const [imageAlt, setImageAlt] = useState(initial?.image_alt ?? "");
  const [sensitive, setSensitive] = useState(initial?.sensitive ?? false);
  const [sourcesText, setSourcesText] = useState((initial?.sources ?? []).join("\n"));
  const [relatedText, setRelatedText] = useState((initial?.related_slugs ?? []).join(", "));
  const [faq, setFaq] = useState<CmsArticleFaqItem[]>(
    initial?.faq?.length ? initial.faq : [],
  );
  const [error, setError] = useState<string | null>(null);
  const [mediaPreviews, setMediaPreviews] = useState<Record<string, string>>({});
  const [pickerOpen, setPickerOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const selectedMedia = media.find((m) => m.id === heroMediaId) ?? null;
  const previewSrc =
    (heroMediaId && mediaPreviews[heroMediaId]) ||
    legacyImagePath.trim() ||
    null;

  useEffect(() => {
    if (!categoryId && categories[0]?.id) setCategoryId(categories[0].id);
  }, [categories, categoryId]);

  useEffect(() => {
    let cancelled = false;
    const ids = new Set<string>();
    if (heroMediaId) ids.add(heroMediaId);
    for (const item of media.slice(0, 48)) ids.add(item.id);
    if (ids.size === 0) return;

    void (async () => {
      const supabase = createClient();
      const next: Record<string, string> = {};
      await Promise.all(
        [...ids].map(async (id) => {
          const item = media.find((m) => m.id === id);
          if (!item) return;
          const { data: signed } = await supabase.storage
            .from("cms-media")
            .createSignedUrl(item.storage_path, 3600);
          if (signed?.signedUrl) next[id] = signed.signedUrl;
        }),
      );
      if (!cancelled) setMediaPreviews((prev) => ({ ...prev, ...next }));
    })();

    return () => {
      cancelled = true;
    };
  }, [media, heroMediaId]);

  function updateTitle(value: string) {
    setTitle(value);
    if (!slugTouched) setSlug(slugify(value));
  }

  function selectMedia(item: CmsMedia) {
    setHeroMediaId(item.id);
    setLegacyImagePath("");
    if (!imageAlt.trim()) setImageAlt(item.alt_text);
    setPickerOpen(false);
  }

  function clearImage() {
    setHeroMediaId("");
    setLegacyImagePath("");
  }

  async function handleUpload() {
    if (!adminToken || !uploadFile) return;
    const alt = imageAlt.trim() || uploadFile.name.replace(/\.[^.]+$/, "");
    if (!alt) {
      setError("Informe o texto alternativo antes de enviar a imagem.");
      return;
    }
    setUploading(true);
    setError(null);
    try {
      const created = await uploadApiFile<CmsMedia>("/admin/cms/media", uploadFile, adminToken, "file", {
        altText: alt,
        status: "PUBLISHED",
      });
      onMediaUploaded?.(created);
      setHeroMediaId(created.id);
      setLegacyImagePath("");
      setImageAlt(created.alt_text);
      setUploadFile(null);
      setPickerOpen(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Upload falhou.");
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    if (!categoryId) {
      setError("Selecione uma categoria.");
      return;
    }
    const sources = sourcesText
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
    const relatedSlugs = relatedText
      .split(",")
      .map((s) => slugify(s.trim()))
      .filter(Boolean);
    const cleanedFaq = faq
      .map((item) => ({ question: item.question.trim(), answer: item.answer.trim() }))
      .filter((item) => item.question && item.answer);

    try {
      await onSubmit({
        categoryId,
        slug: slug.trim(),
        title: title.trim(),
        description: description.trim(),
        bodyMdx: bodyMdx.trim(),
        status,
        author: author.trim(),
        reviewer: reviewer.trim() || null,
        reviewerCrp: reviewerCrp.trim() || null,
        heroMediaId: heroMediaId || null,
        legacyImagePath: legacyImagePath.trim() || null,
        imageAlt: imageAlt.trim() || null,
        sensitive,
        sources,
        faq: cleanedFaq,
        relatedSlugs,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível salvar.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {error && <p className="text-sm text-red-700">{error}</p>}

      <div className="grid gap-4 sm:grid-cols-2">
        <label className={labelClass}>
          Título
          <input
            required
            maxLength={200}
            value={title}
            onChange={(e) => updateTitle(e.target.value)}
            className={inputClass}
          />
        </label>
        <label className={labelClass}>
          Slug
          <input
            required
            pattern="^[a-z0-9]+(?:-[a-z0-9]+)*$"
            value={slug}
            onChange={(e) => {
              setSlugTouched(true);
              setSlug(e.target.value);
            }}
            className={inputClass}
          />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className={labelClass}>
          Categoria
          <select
            required
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className={inputClass}
          >
            {categories.length === 0 && <option value="">Nenhuma categoria</option>}
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.status === "PUBLISHED" ? "pub." : "rasc."})
              </option>
            ))}
          </select>
        </label>
        <label className={labelClass}>
          Status
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as CmsContentStatus)}
            className={inputClass}
          >
            <option value="DRAFT">Rascunho</option>
            <option value="PUBLISHED">Publicado</option>
          </select>
        </label>
      </div>

      <label className={labelClass}>
        Descrição (SEO / card)
        <textarea
          required
          maxLength={500}
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className={inputClass}
        />
      </label>

      <fieldset className="rounded-card border border-calm-200 bg-white p-4">
        <legend className="px-1 text-sm font-medium text-calm-800">Imagem do card</legend>
        <p className="mt-1 text-xs text-calm-600">
          Aparece no card da listagem e no hero do artigo. Preferir mídia publicada na biblioteca.
        </p>

        <div className="mt-3 flex aspect-video max-w-md items-center justify-center overflow-hidden rounded-lg bg-calm-100">
          {previewSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewSrc}
              alt={imageAlt || selectedMedia?.alt_text || title || "Prévia"}
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="px-4 text-center text-xs text-calm-600">Nenhuma imagem selecionada</span>
          )}
        </div>

        {(selectedMedia || legacyImagePath) && (
          <p className="mt-2 truncate text-xs text-calm-600">
            {selectedMedia
              ? `${selectedMedia.alt_text} · ${selectedMedia.status === "PUBLISHED" ? "publicada" : "rascunho"}`
              : `Path legado: ${legacyImagePath}`}
          </p>
        )}
        {selectedMedia && selectedMedia.status !== "PUBLISHED" && (
          <p className="mt-1 text-xs text-amber-800">
            Esta mídia está em rascunho — publique-a em Mídia para aparecer no site público.
          </p>
        )}

        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setPickerOpen((open) => !open)}
            className="rounded-full border border-calm-200 px-3 py-1.5 text-sm text-calm-800 hover:bg-calm-100"
          >
            {pickerOpen ? "Fechar biblioteca" : "Escolher da biblioteca"}
          </button>
          <button
            type="button"
            onClick={clearImage}
            disabled={!heroMediaId && !legacyImagePath}
            className="rounded-full border border-calm-200 px-3 py-1.5 text-sm text-calm-800 hover:bg-calm-100 disabled:opacity-40"
          >
            Remover imagem
          </button>
        </div>

        {pickerOpen && (
          <div className="mt-4 space-y-4 border-t border-calm-100 pt-4">
            {media.length === 0 ? (
              <p className="text-xs text-calm-600">Nenhuma mídia na biblioteca. Envie uma abaixo.</p>
            ) : (
              <ul className="grid max-h-64 grid-cols-2 gap-2 overflow-y-auto sm:grid-cols-3">
                {media.map((item) => {
                  const selected = item.id === heroMediaId;
                  return (
                    <li key={item.id}>
                      <button
                        type="button"
                        onClick={() => selectMedia(item)}
                        className={`w-full overflow-hidden rounded-lg border text-left transition ${
                          selected
                            ? "border-sage-600 ring-2 ring-sage-600/30"
                            : "border-calm-200 hover:border-sage-600/50"
                        }`}
                      >
                        <div className="flex aspect-video items-center justify-center bg-calm-100">
                          {mediaPreviews[item.id] ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={mediaPreviews[item.id]}
                              alt={item.alt_text}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <span className="text-[10px] text-calm-500">{item.mime_type}</span>
                          )}
                        </div>
                        <p className="truncate px-2 py-1 text-[11px] text-calm-800">{item.alt_text}</p>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}

            {adminToken && (
              <div className="rounded-lg bg-calm-50 p-3">
                <p className="text-sm font-medium text-calm-800">Enviar nova imagem</p>
                <p className="mt-0.5 text-xs text-calm-600">JPEG, PNG, WebP ou AVIF · até 5 MB · publicada automaticamente</p>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/avif"
                  onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)}
                  className="mt-2 block w-full text-sm text-calm-800 file:mr-3 file:rounded-full file:border-0 file:bg-sage-100 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-sage-600"
                />
                <button
                  type="button"
                  disabled={uploading || !uploadFile}
                  onClick={() => void handleUpload()}
                  className="mt-2 rounded-full bg-sage-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-sage-600/90 disabled:opacity-60"
                >
                  {uploading ? "Enviando…" : "Enviar e usar"}
                </button>
              </div>
            )}
          </div>
        )}

        <label className={`${labelClass} mt-4`}>
          Alt da imagem
          <input
            maxLength={500}
            value={imageAlt}
            onChange={(e) => setImageAlt(e.target.value)}
            placeholder="Descrição acessível da imagem"
            className={inputClass}
          />
        </label>

        <label className={`${labelClass} mt-3`}>
          Path legado (opcional)
          <input
            maxLength={2048}
            value={legacyImagePath}
            onChange={(e) => {
              setLegacyImagePath(e.target.value);
              if (e.target.value.trim()) setHeroMediaId("");
            }}
            placeholder="/images/..."
            className={inputClass}
          />
          <span className="mt-1 block text-xs font-normal text-calm-600">
            Usado pelo seed MDX. Ao escolher mídia da biblioteca, este campo é limpo.
          </span>
        </label>
      </fieldset>

      <label className={labelClass}>
        Corpo (Markdown / MDX)
        <textarea
          required
          rows={16}
          value={bodyMdx}
          onChange={(e) => setBodyMdx(e.target.value)}
          className={`${inputClass} font-mono text-xs leading-relaxed`}
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-3">
        <label className={labelClass}>
          Autor
          <input
            required
            maxLength={160}
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            className={inputClass}
          />
        </label>
        <label className={labelClass}>
          Revisor
          <input
            maxLength={160}
            value={reviewer}
            onChange={(e) => setReviewer(e.target.value)}
            className={inputClass}
          />
        </label>
        <label className={labelClass}>
          CRP do revisor
          <input
            maxLength={40}
            value={reviewerCrp}
            onChange={(e) => setReviewerCrp(e.target.value)}
            className={inputClass}
          />
        </label>
      </div>

      <label className="flex items-center gap-2 text-sm text-calm-800">
        <input
          type="checkbox"
          checked={sensitive}
          onChange={(e) => setSensitive(e.target.checked)}
          className="rounded border-calm-200"
        />
        Conteúdo sensível (exibir aviso)
      </label>

      <label className={labelClass}>
        Fontes (uma por linha)
        <textarea
          rows={3}
          value={sourcesText}
          onChange={(e) => setSourcesText(e.target.value)}
          className={inputClass}
        />
      </label>

      <label className={labelClass}>
        Artigos relacionados (slugs, separados por vírgula)
        <input
          value={relatedText}
          onChange={(e) => setRelatedText(e.target.value)}
          className={inputClass}
        />
      </label>

      <fieldset className="rounded-card border border-calm-200 p-4">
        <legend className="px-1 text-sm font-medium text-calm-800">FAQ</legend>
        <div className="mt-2 flex flex-col gap-4">
          {faq.map((item, index) => (
            <div key={index} className="flex flex-col gap-2 rounded-lg bg-calm-50 p-3">
              <input
                placeholder="Pergunta"
                value={item.question}
                onChange={(e) => {
                  const next = [...faq];
                  next[index] = { ...next[index], question: e.target.value };
                  setFaq(next);
                }}
                className={inputClass}
              />
              <textarea
                placeholder="Resposta"
                rows={2}
                value={item.answer}
                onChange={(e) => {
                  const next = [...faq];
                  next[index] = { ...next[index], answer: e.target.value };
                  setFaq(next);
                }}
                className={inputClass}
              />
              <button
                type="button"
                onClick={() => setFaq(faq.filter((_, i) => i !== index))}
                className="self-start text-xs text-calm-600 hover:text-red-700"
              >
                Remover
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => setFaq([...faq, emptyFaq()])}
            className="self-start rounded-full border border-calm-200 px-3 py-1.5 text-sm text-calm-800 hover:bg-calm-100"
          >
            Adicionar FAQ
          </button>
        </div>
      </fieldset>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={submitting || categories.length === 0}
          className="rounded-full bg-sage-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-sage-600/90 disabled:opacity-60"
        >
          {submitting ? "Salvando…" : submitLabel}
        </button>
      </div>
    </form>
  );
}
