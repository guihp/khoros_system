import { cmsSectionSchema, type CmsSection } from "@khoros/shared";
import { CMS_TAGS } from "./tags";

const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001").replace(/\/$/, "");

export class CmsEmptyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CmsEmptyError";
  }
}

export class CmsNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CmsNotFoundError";
  }
}

interface CmsMediaRow {
  id: string;
  storage_path: string;
  alt_text: string;
  mime_type: string;
  status: string;
}

export interface CmsCategoryRow {
  id: string;
  slug: string;
  name: string;
  description: string;
  legacy_image_path: string | null;
  position: number;
  status: string;
  image_media?: CmsMediaRow | null;
}

export interface CmsArticleRow {
  id: string;
  slug: string;
  title: string;
  description: string;
  body_mdx: string;
  status: string;
  author: string;
  reviewer: string | null;
  reviewer_crp: string | null;
  legacy_image_path: string | null;
  image_alt: string | null;
  sensitive: boolean;
  sources: string[];
  faq: Array<{ question: string; answer: string }>;
  related_slugs: string[];
  published_at: string | null;
  updated_at: string;
  category: CmsCategoryRow;
  hero_media?: CmsMediaRow | null;
}

export interface CmsPageSectionRow {
  id: string;
  page_id: string;
  type: string;
  position: number;
  is_visible: boolean;
  config: unknown;
}

export interface CmsPageRow {
  id: string;
  slug: string;
  title: string;
  status: string;
  published_at: string | null;
  updated_at: string;
  sections: CmsPageSectionRow[];
}

export interface CmsPageWithSections {
  id: string;
  slug: string;
  title: string;
  updatedAt: string;
  sections: Array<CmsSection & { id: string; position: number }>;
}

async function cmsFetch<T>(path: string, tags: string[]): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      headers: { Accept: "application/json" },
      next: { tags },
    });
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    throw new Error(
      `CMS API inacessível (${API_URL}${path}): ${reason}. Confirme NEXT_PUBLIC_API_URL e que a API está no ar.`,
    );
  }

  if (res.status === 404) {
    throw new CmsNotFoundError(`CMS: recurso não encontrado (${path}).`);
  }

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`CMS API erro ${res.status} em ${path}${body ? `: ${body.slice(0, 200)}` : ""}`);
  }

  return res.json() as Promise<T>;
}

/** Stable proxy — see `/api/cms/media/[id]`. Only for PUBLISHED media. */
function mediaProxyUrl(media: CmsMediaRow | null | undefined): string | undefined {
  if (!media?.id) return undefined;
  if (media.status && media.status !== "PUBLISHED") return undefined;
  return `/api/cms/media/${media.id}`;
}

/**
 * Resolve card/hero image for marketing.
 * Prefer `legacy_image_path` (seeded `/images/...`); otherwise proxy published
 * `cms_media` through Next so the private bucket still displays on the site.
 */
export function resolveCmsImage(
  legacyPath: string | null | undefined,
  media: CmsMediaRow | null | undefined,
): { src?: string; alt?: string } {
  const src = legacyPath || mediaProxyUrl(media) || undefined;
  const alt = media?.alt_text || undefined;
  return { src, alt };
}

export async function fetchCmsCategories(): Promise<CmsCategoryRow[]> {
  const data = await cmsFetch<{ items: CmsCategoryRow[] }>("/cms/categories", [
    CMS_TAGS.all,
    CMS_TAGS.categories,
  ]);
  const items = data.items ?? [];
  if (items.length === 0) {
    throw new CmsEmptyError(
      "CMS sem categorias publicadas. Rode o seed (seed-cms-from-mdx) e publique categorias antes de servir o marketing.",
    );
  }
  return items;
}

export async function fetchCmsArticles(categorySlug?: string): Promise<CmsArticleRow[]> {
  const query = categorySlug ? `?category=${encodeURIComponent(categorySlug)}` : "";
  const data = await cmsFetch<{ items: CmsArticleRow[] }>(`/cms/articles${query}`, [
    CMS_TAGS.all,
    CMS_TAGS.articles,
  ]);
  const items = data.items ?? [];
  if (items.length === 0) {
    throw new CmsEmptyError(
      categorySlug
        ? `CMS sem artigos publicados na categoria "${categorySlug}". Publique conteúdo ou rode o seed.`
        : "CMS sem artigos publicados. Rode o seed (seed-cms-from-mdx) e publique artigos antes de servir o blog.",
    );
  }
  return items;
}

export async function fetchCmsArticle(
  categorySlug: string,
  slug: string,
): Promise<CmsArticleRow> {
  return cmsFetch<CmsArticleRow>(
    `/cms/articles/${encodeURIComponent(categorySlug)}/${encodeURIComponent(slug)}`,
    [CMS_TAGS.all, CMS_TAGS.articles, CMS_TAGS.article(categorySlug, slug)],
  );
}

export async function fetchCmsPage(slug: string): Promise<CmsPageWithSections> {
  const page = await cmsFetch<CmsPageRow>(`/cms/pages/${encodeURIComponent(slug)}`, [
    CMS_TAGS.all,
    CMS_TAGS.pages,
    CMS_TAGS.page(slug),
  ]);

  const sections = (page.sections ?? [])
    .filter((row) => row.is_visible)
    .sort((a, b) => a.position - b.position)
    .flatMap((row) => {
      const parsed = cmsSectionSchema.safeParse({ type: row.type, config: row.config });
      if (!parsed.success) {
        console.error(`CMS section ${row.id} inválida:`, parsed.error.flatten());
        return [];
      }
      return [{ ...parsed.data, id: row.id, position: row.position }];
    });

  if (sections.length === 0) {
    throw new CmsEmptyError(
      `CMS página "${slug}" publicada sem seções visíveis. Seed/edite seções no admin.`,
    );
  }

  return {
    id: page.id,
    slug: page.slug,
    title: page.title,
    updatedAt: page.updated_at,
    sections,
  };
}
