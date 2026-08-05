import readingTime from "reading-time";
import {
  CmsEmptyError,
  CmsNotFoundError,
  fetchCmsArticle,
  fetchCmsArticles,
  resolveCmsImage,
  type CmsArticleRow,
} from "@/lib/cms/client";

export interface ArticleFAQ {
  question: string;
  answer: string;
}

export interface ArticleFrontmatter {
  title: string;
  description: string;
  category: string;
  slug: string;
  publishedAt: string;
  updatedAt?: string;
  author: string;
  reviewer?: string;
  reviewerCrp?: string;
  image?: string;
  imageAlt?: string;
  sensitive?: boolean;
  sources?: string[];
  faq?: ArticleFAQ[];
  relatedSlugs?: string[];
}

export interface Article extends ArticleFrontmatter {
  content: string;
  readingTime: string;
  /** Nome da categoria (vindo do join CMS). */
  categoryName?: string;
}

function mapArticle(row: CmsArticleRow): Article {
  const image = resolveCmsImage(row.legacy_image_path, row.hero_media);
  const stats = readingTime(row.body_mdx);
  const publishedAt = row.published_at ?? row.updated_at;

  return {
    title: row.title,
    description: row.description,
    category: row.category.slug,
    categoryName: row.category.name,
    slug: row.slug,
    publishedAt,
    updatedAt: row.updated_at,
    author: row.author,
    reviewer: row.reviewer ?? undefined,
    reviewerCrp: row.reviewer_crp ?? undefined,
    image: image.src,
    imageAlt: row.image_alt ?? image.alt,
    sensitive: row.sensitive,
    sources: row.sources ?? [],
    faq: row.faq ?? [],
    relatedSlugs: row.related_slugs ?? [],
    content: row.body_mdx,
    readingTime: stats.text,
  };
}

export async function getAllArticles(): Promise<Article[]> {
  const rows = await fetchCmsArticles();
  return rows.map(mapArticle);
}

export async function getArticleBySlug(
  category: string,
  slug: string,
): Promise<Article | undefined> {
  try {
    const row = await fetchCmsArticle(category, slug);
    return mapArticle(row);
  } catch (err) {
    if (err instanceof CmsNotFoundError) return undefined;
    throw err;
  }
}

export async function getArticlesByCategory(category: string): Promise<Article[]> {
  try {
    const rows = await fetchCmsArticles(category);
    return rows.map(mapArticle);
  } catch (err) {
    if (err instanceof CmsEmptyError) return [];
    throw err;
  }
}

export async function getRelatedArticles(article: Article, limit = 3): Promise<Article[]> {
  const all = (await getAllArticles()).filter(
    (a) => !(a.category === article.category && a.slug === article.slug),
  );

  const related = article.relatedSlugs?.length
    ? all.filter((a) => {
        const key = `${a.category}/${a.slug}`;
        return (
          article.relatedSlugs?.includes(key) ||
          article.relatedSlugs?.includes(a.slug)
        );
      })
    : all.filter((a) => a.category === article.category);

  return related.slice(0, limit);
}
