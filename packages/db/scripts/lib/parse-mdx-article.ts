import matter from "gray-matter";
import { asciiRelatedSlug, asciiSlug } from "./slugify.js";

export interface ParsedArticleFaq {
  question: string;
  answer: string;
}

export interface ParsedArticle {
  categorySlug: string;
  slug: string;
  originalSlug: string;
  slugNormalized: boolean;
  title: string;
  description: string;
  bodyMdx: string;
  author: string;
  reviewer: string | null;
  reviewerCrp: string | null;
  legacyImagePath: string | null;
  imageAlt: string | null;
  sensitive: boolean;
  sources: string[];
  faq: ParsedArticleFaq[];
  relatedSlugs: string[];
  publishedAt: Date;
  sourceFile: string;
}

function asString(value: unknown, field: string, file: string): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${file}: frontmatter.${field} obrigatório`);
  }
  return value.trim();
}

function asOptionalString(value: unknown): string | null {
  if (value == null) return null;
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    .map((item) => item.trim());
}

function asFaq(value: unknown, file: string): ParsedArticleFaq[] {
  if (value == null) return [];
  if (!Array.isArray(value)) {
    throw new Error(`${file}: frontmatter.faq deve ser array`);
  }
  return value.map((item, index) => {
    if (!item || typeof item !== "object") {
      throw new Error(`${file}: faq[${index}] inválido`);
    }
    const row = item as Record<string, unknown>;
    const question = asString(row.question, `faq[${index}].question`, file);
    const answer = asString(row.answer, `faq[${index}].answer`, file);
    if (question.length > 300) {
      throw new Error(`${file}: faq[${index}].question excede 300 chars`);
    }
    if (answer.length > 5000) {
      throw new Error(`${file}: faq[${index}].answer excede 5000 chars`);
    }
    return { question, answer };
  });
}

export function parseMdxArticle(sourceFile: string, raw: string): ParsedArticle {
  const { data, content } = matter(raw);
  const bodyMdx = content.trim();
  if (!bodyMdx) {
    throw new Error(`${sourceFile}: body MDX vazio`);
  }

  const title = asString(data.title, "title", sourceFile);
  const description = asString(data.description, "description", sourceFile);
  const author = asString(data.author, "author", sourceFile);
  const categorySlug = asciiSlug(asString(data.category, "category", sourceFile));
  const originalSlug = asString(data.slug, "slug", sourceFile);
  const slug = asciiSlug(originalSlug);
  const publishedRaw = asString(data.publishedAt, "publishedAt", sourceFile);
  const publishedAt = new Date(publishedRaw);
  if (Number.isNaN(publishedAt.getTime())) {
    throw new Error(`${sourceFile}: publishedAt inválido (${publishedRaw})`);
  }

  if (title.length > 200) throw new Error(`${sourceFile}: title excede 200 chars`);
  if (description.length > 500) throw new Error(`${sourceFile}: description excede 500 chars`);
  if (author.length > 160) throw new Error(`${sourceFile}: author excede 160 chars`);

  const reviewer = asOptionalString(data.reviewer);
  const reviewerCrp = asOptionalString(data.reviewerCrp ?? data.reviewer_crp);
  if (reviewerCrp && !reviewer) {
    throw new Error(`${sourceFile}: reviewer_crp exige reviewer`);
  }

  return {
    categorySlug,
    slug,
    originalSlug,
    slugNormalized: didNormalizeSlug(originalSlug, slug),
    title,
    description,
    bodyMdx,
    author,
    reviewer,
    reviewerCrp,
    legacyImagePath: asOptionalString(data.image),
    imageAlt: asOptionalString(data.imageAlt ?? data.image_alt),
    sensitive: Boolean(data.sensitive),
    sources: asStringArray(data.sources),
    faq: asFaq(data.faq, sourceFile),
    relatedSlugs: asStringArray(data.relatedSlugs ?? data.related_slugs).map(asciiRelatedSlug),
    publishedAt,
    sourceFile,
  };
}

/** Corrige detecção de normalização: true se o slug ASCII difere do original. */
export function didNormalizeSlug(original: string, normalized: string): boolean {
  return original !== normalized;
}
