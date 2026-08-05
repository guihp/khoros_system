"use client";

import { useState, type ChangeEvent, type FormEvent, type ReactNode } from "react";
import {
  cmsSectionSchema,
  type CmsSection,
  type CmsSectionType,
} from "@khoros/shared";

type ButtonItem = {
  label: string;
  href: string;
  variant?: "primary" | "secondary" | "link";
};

type FaqItem = { question: string; answer: string };
type StepItem = { title: string; text: string };

const inputClass =
  "mt-1 w-full rounded-lg border border-calm-200 bg-white px-3 py-2 text-sm text-calm-900 outline-none focus:border-sage-600";
const labelClass = "block text-sm font-medium text-calm-800";
const helpClass = "mt-1 text-xs text-calm-600";

interface SectionConfigFormProps {
  type: CmsSectionType;
  initialConfig: Record<string, unknown>;
  saving?: boolean;
  onSave: (config: CmsSection["config"]) => Promise<void> | void;
  onCancel?: () => void;
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function asNumber(value: unknown): number | "" {
  return typeof value === "number" && Number.isFinite(value) ? value : "";
}

function asBool(value: unknown, fallback = false): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function asButtons(value: unknown): ButtonItem[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => {
    const row = (item ?? {}) as Record<string, unknown>;
    const variant = row.variant;
    return {
      label: asString(row.label),
      href: asString(row.href, "/"),
      variant:
        variant === "primary" || variant === "secondary" || variant === "link"
          ? variant
          : undefined,
    };
  });
}

function asFaqItems(value: unknown): FaqItem[] {
  if (!Array.isArray(value)) return [{ question: "", answer: "" }];
  return value.map((item) => {
    const row = (item ?? {}) as Record<string, unknown>;
    return { question: asString(row.question), answer: asString(row.answer) };
  });
}

function asStepItems(value: unknown): StepItem[] {
  if (!Array.isArray(value)) return [{ title: "", text: "" }];
  return value.map((item) => {
    const row = (item ?? {}) as Record<string, unknown>;
    return { title: asString(row.title), text: asString(row.text) };
  });
}

function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <label className={labelClass}>
      {label}
      {children}
      {hint ? <span className={helpClass}>{hint}</span> : null}
    </label>
  );
}

function ButtonListEditor({
  value,
  onChange,
  min = 0,
  max = 3,
}: {
  value: ButtonItem[];
  onChange: (next: ButtonItem[]) => void;
  min?: number;
  max?: number;
}) {
  function update(index: number, patch: Partial<ButtonItem>) {
    onChange(value.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }

  return (
    <div className="space-y-3">
      {value.map((button, index) => (
        <div key={index} className="rounded-lg border border-calm-200 bg-calm-50 p-3 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-medium text-calm-600">Botão {index + 1}</p>
            {value.length > min ? (
              <button
                type="button"
                className="text-xs text-red-700 hover:underline"
                onClick={() => onChange(value.filter((_, i) => i !== index))}
              >
                Remover
              </button>
            ) : null}
          </div>
          <input
            className={inputClass}
            value={button.label}
            placeholder="Rótulo"
            onChange={(e) => update(index, { label: e.target.value })}
          />
          <input
            className={inputClass}
            value={button.href}
            placeholder="/caminho ou https://"
            onChange={(e) => update(index, { href: e.target.value })}
          />
          <select
            className={inputClass}
            value={button.variant ?? ""}
            onChange={(e) =>
              update(index, {
                variant: e.target.value
                  ? (e.target.value as ButtonItem["variant"])
                  : undefined,
              })
            }
          >
            <option value="">Variante padrão</option>
            <option value="primary">Primário</option>
            <option value="secondary">Secundário</option>
            <option value="link">Link</option>
          </select>
        </div>
      ))}
      {value.length < max ? (
        <button
          type="button"
          className="text-sm font-medium text-sage-600 hover:underline"
          onClick={() =>
            onChange([...value, { label: "Novo botão", href: "/", variant: "primary" }])
          }
        >
          + Adicionar botão
        </button>
      ) : null}
    </div>
  );
}

export function SectionConfigForm({
  type,
  initialConfig,
  saving = false,
  onSave,
  onCancel,
}: SectionConfigFormProps) {
  const [error, setError] = useState<string | null>(null);

  // Shared primitive fields
  const [title, setTitle] = useState(asString(initialConfig.title));
  const [text, setText] = useState(asString(initialConfig.text));
  const [eyebrow, setEyebrow] = useState(asString(initialConfig.eyebrow));
  const [subtitle, setSubtitle] = useState(asString(initialConfig.subtitle));
  const [markdown, setMarkdown] = useState(asString(initialConfig.markdown));
  const [limit, setLimit] = useState(asNumber(initialConfig.limit));
  const [categorySlug, setCategorySlug] = useState(asString(initialConfig.categorySlug));
  const [formId, setFormId] = useState(asString(initialConfig.formId));
  const [showCvv, setShowCvv] = useState(asBool(initialConfig.showCvv, true));
  const [showSamu, setShowSamu] = useState(asBool(initialConfig.showSamu, true));
  const [showEmergency, setShowEmergency] = useState(asBool(initialConfig.showEmergency, true));
  const [showCaps, setShowCaps] = useState(asBool(initialConfig.showCaps, true));
  const [ctas, setCtas] = useState(asButtons(initialConfig.ctas));
  const [buttons, setButtons] = useState(asButtons(initialConfig.buttons));
  const [faqItems, setFaqItems] = useState(asFaqItems(initialConfig.items));
  const [stepItems, setStepItems] = useState(asStepItems(initialConfig.items));
  const [cta, setCta] = useState<ButtonItem | null>(() => {
    if (initialConfig.cta && typeof initialConfig.cta === "object") {
      const row = initialConfig.cta as Record<string, unknown>;
      return {
        label: asString(row.label),
        href: asString(row.href, "/"),
        variant:
          row.variant === "primary" || row.variant === "secondary" || row.variant === "link"
            ? row.variant
            : undefined,
      };
    }
    return null;
  });

  function buildConfig(): unknown {
    switch (type) {
      case "hero":
        return {
          ...(eyebrow.trim() ? { eyebrow: eyebrow.trim() } : {}),
          title: title.trim(),
          ...(subtitle.trim() ? { subtitle: subtitle.trim() } : {}),
          ctas,
        };
      case "category_grid":
        return {
          ...(title.trim() ? { title: title.trim() } : {}),
          ...(limit === "" ? {} : { limit: Number(limit) }),
        };
      case "article_list":
        return {
          ...(title.trim() ? { title: title.trim() } : {}),
          ...(limit === "" ? {} : { limit: Number(limit) }),
          ...(categorySlug.trim() ? { categorySlug: categorySlug.trim() } : {}),
        };
      case "rich_text":
        return { markdown: markdown.trim() };
      case "cta_band":
        return {
          title: title.trim(),
          ...(text.trim() ? { text: text.trim() } : {}),
          buttons,
        };
      case "faq":
        return {
          ...(title.trim() ? { title: title.trim() } : {}),
          items: faqItems,
        };
      case "steps":
        return {
          ...(title.trim() ? { title: title.trim() } : {}),
          items: stepItems,
        };
      case "crisis_banner":
        return {
          title: title.trim(),
          text: text.trim(),
          showCvv,
          showSamu,
          showEmergency,
          showCaps,
        };
      case "validation_block":
        return {
          title: title.trim(),
          text: text.trim(),
          ...(formId.trim() ? { formId: formId.trim() } : {}),
          ...(cta ? { cta } : {}),
        };
      case "disclaimer":
        return {
          ...(title.trim() ? { title: title.trim() } : {}),
          text: text.trim(),
        };
      default:
        return {};
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    const parsed = cmsSectionSchema.safeParse({ type, config: buildConfig() });
    if (!parsed.success) {
      setError(parsed.error.issues.map((issue) => issue.message).join("; "));
      return;
    }
    try {
      await onSave(parsed.data.config);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível salvar.");
    }
  }

  function onLimitChange(e: ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value;
    setLimit(raw === "" ? "" : Number(raw));
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {type === "hero" && (
        <>
          <Field label="Eyebrow (opcional)">
            <input className={inputClass} value={eyebrow} onChange={(e) => setEyebrow(e.target.value)} />
          </Field>
          <Field label="Título">
            <input className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} required />
          </Field>
          <Field label="Subtítulo (opcional)">
            <textarea
              className={inputClass}
              rows={3}
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
            />
          </Field>
          <div>
            <p className={labelClass}>CTAs</p>
            <div className="mt-1">
              <ButtonListEditor value={ctas} onChange={setCtas} min={0} max={3} />
            </div>
          </div>
        </>
      )}

      {type === "category_grid" && (
        <>
          <Field label="Título (opcional)">
            <input className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} />
          </Field>
          <Field label="Limite" hint="1 a 24">
            <input
              className={inputClass}
              type="number"
              min={1}
              max={24}
              value={limit}
              onChange={onLimitChange}
            />
          </Field>
        </>
      )}

      {type === "article_list" && (
        <>
          <Field label="Título (opcional)">
            <input className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} />
          </Field>
          <Field label="Limite" hint="1 a 24">
            <input
              className={inputClass}
              type="number"
              min={1}
              max={24}
              value={limit}
              onChange={onLimitChange}
            />
          </Field>
          <Field label="Slug da categoria (opcional)" hint="ex.: ansiedade">
            <input
              className={inputClass}
              value={categorySlug}
              onChange={(e) => setCategorySlug(e.target.value)}
            />
          </Field>
        </>
      )}

      {type === "rich_text" && (
        <Field label="Markdown">
          <textarea
            className={inputClass}
            rows={12}
            value={markdown}
            onChange={(e) => setMarkdown(e.target.value)}
            required
          />
        </Field>
      )}

      {type === "cta_band" && (
        <>
          <Field label="Título">
            <input className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} required />
          </Field>
          <Field label="Texto (opcional)">
            <textarea className={inputClass} rows={3} value={text} onChange={(e) => setText(e.target.value)} />
          </Field>
          <div>
            <p className={labelClass}>Botões</p>
            <div className="mt-1">
              <ButtonListEditor value={buttons} onChange={setButtons} min={1} max={3} />
            </div>
          </div>
        </>
      )}

      {type === "faq" && (
        <>
          <Field label="Título (opcional)">
            <input className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} />
          </Field>
          <div className="space-y-3">
            <p className={labelClass}>Itens</p>
            {faqItems.map((item, index) => (
              <div key={index} className="rounded-lg border border-calm-200 bg-calm-50 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-calm-600">Item {index + 1}</p>
                  {faqItems.length > 1 ? (
                    <button
                      type="button"
                      className="text-xs text-red-700 hover:underline"
                      onClick={() => setFaqItems(faqItems.filter((_, i) => i !== index))}
                    >
                      Remover
                    </button>
                  ) : null}
                </div>
                <input
                  className={inputClass}
                  placeholder="Pergunta"
                  value={item.question}
                  onChange={(e) =>
                    setFaqItems(
                      faqItems.map((row, i) =>
                        i === index ? { ...row, question: e.target.value } : row,
                      ),
                    )
                  }
                />
                <textarea
                  className={inputClass}
                  rows={3}
                  placeholder="Resposta"
                  value={item.answer}
                  onChange={(e) =>
                    setFaqItems(
                      faqItems.map((row, i) =>
                        i === index ? { ...row, answer: e.target.value } : row,
                      ),
                    )
                  }
                />
              </div>
            ))}
            {faqItems.length < 50 ? (
              <button
                type="button"
                className="text-sm font-medium text-sage-600 hover:underline"
                onClick={() => setFaqItems([...faqItems, { question: "", answer: "" }])}
              >
                + Adicionar pergunta
              </button>
            ) : null}
          </div>
        </>
      )}

      {type === "steps" && (
        <>
          <Field label="Título (opcional)">
            <input className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} />
          </Field>
          <div className="space-y-3">
            <p className={labelClass}>Passos</p>
            {stepItems.map((item, index) => (
              <div key={index} className="rounded-lg border border-calm-200 bg-calm-50 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-calm-600">Passo {index + 1}</p>
                  {stepItems.length > 1 ? (
                    <button
                      type="button"
                      className="text-xs text-red-700 hover:underline"
                      onClick={() => setStepItems(stepItems.filter((_, i) => i !== index))}
                    >
                      Remover
                    </button>
                  ) : null}
                </div>
                <input
                  className={inputClass}
                  placeholder="Título"
                  value={item.title}
                  onChange={(e) =>
                    setStepItems(
                      stepItems.map((row, i) =>
                        i === index ? { ...row, title: e.target.value } : row,
                      ),
                    )
                  }
                />
                <textarea
                  className={inputClass}
                  rows={2}
                  placeholder="Texto"
                  value={item.text}
                  onChange={(e) =>
                    setStepItems(
                      stepItems.map((row, i) =>
                        i === index ? { ...row, text: e.target.value } : row,
                      ),
                    )
                  }
                />
              </div>
            ))}
            {stepItems.length < 12 ? (
              <button
                type="button"
                className="text-sm font-medium text-sage-600 hover:underline"
                onClick={() => setStepItems([...stepItems, { title: "", text: "" }])}
              >
                + Adicionar passo
              </button>
            ) : null}
          </div>
        </>
      )}

      {type === "crisis_banner" && (
        <>
          <Field label="Título">
            <input className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} required />
          </Field>
          <Field label="Texto">
            <textarea
              className={inputClass}
              rows={4}
              value={text}
              onChange={(e) => setText(e.target.value)}
              required
            />
          </Field>
          <div className="grid gap-2 sm:grid-cols-2">
            {(
              [
                ["CVV 188", showCvv, setShowCvv],
                ["SAMU 192", showSamu, setShowSamu],
                ["Emergência 190", showEmergency, setShowEmergency],
                ["CAPS", showCaps, setShowCaps],
              ] as const
            ).map(([label, checked, setter]) => (
              <label key={label} className="flex items-center gap-2 text-sm text-calm-800">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(e) => setter(e.target.checked)}
                  className="rounded border-calm-200"
                />
                Exibir {label}
              </label>
            ))}
          </div>
        </>
      )}

      {type === "validation_block" && (
        <>
          <Field label="Título">
            <input className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} required />
          </Field>
          <Field label="Texto">
            <textarea
              className={inputClass}
              rows={4}
              value={text}
              onChange={(e) => setText(e.target.value)}
              required
            />
          </Field>
          <Field label="ID do formulário (opcional)">
            <input className={inputClass} value={formId} onChange={(e) => setFormId(e.target.value)} />
          </Field>
          <div className="rounded-lg border border-calm-200 bg-calm-50 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-calm-600">CTA opcional</p>
              {cta ? (
                <button
                  type="button"
                  className="text-xs text-red-700 hover:underline"
                  onClick={() => setCta(null)}
                >
                  Remover
                </button>
              ) : (
                <button
                  type="button"
                  className="text-xs font-medium text-sage-600 hover:underline"
                  onClick={() => setCta({ label: "Continuar", href: "/", variant: "primary" })}
                >
                  Adicionar
                </button>
              )}
            </div>
            {cta ? (
              <>
                <input
                  className={inputClass}
                  value={cta.label}
                  onChange={(e) => setCta({ ...cta, label: e.target.value })}
                  placeholder="Rótulo"
                />
                <input
                  className={inputClass}
                  value={cta.href}
                  onChange={(e) => setCta({ ...cta, href: e.target.value })}
                  placeholder="/caminho ou https://"
                />
              </>
            ) : null}
          </div>
        </>
      )}

      {type === "disclaimer" && (
        <>
          <Field label="Título (opcional)">
            <input className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} />
          </Field>
          <Field label="Texto">
            <textarea
              className={inputClass}
              rows={4}
              value={text}
              onChange={(e) => setText(e.target.value)}
              required
            />
          </Field>
        </>
      )}

      {error ? <p className="text-sm text-red-700">{error}</p> : null}

      <div className="flex flex-wrap gap-2 pt-2">
        <button
          type="submit"
          disabled={saving}
          className="rounded-full bg-sage-600 px-4 py-2 text-sm font-medium text-white hover:bg-sage-600/90 disabled:opacity-60"
        >
          {saving ? "Salvando…" : "Salvar configuração"}
        </button>
        {onCancel ? (
          <button
            type="button"
            disabled={saving}
            onClick={onCancel}
            className="rounded-full border border-calm-200 px-4 py-2 text-sm font-medium text-calm-800 hover:bg-calm-100 disabled:opacity-60"
          >
            Cancelar
          </button>
        ) : null}
      </div>
    </form>
  );
}
