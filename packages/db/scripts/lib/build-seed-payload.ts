import fs from "node:fs";
import path from "node:path";
import { parseMdxArticle, type ParsedArticle } from "./parse-mdx-article.js";
import {
  buildMarketingPages,
  type CategorySeedItem,
  type FaqSeedItem,
  type SeedPage,
} from "./marketing-pages.js";

export interface SeedCategory {
  slug: string;
  name: string;
  description: string;
  legacyImagePath: string | null;
  position: number;
}

export interface SeedPayload {
  categories: SeedCategory[];
  articles: ParsedArticle[];
  pages: SeedPage[];
  warnings: string[];
}

export interface CategorySource {
  slug: string;
  name: string;
  description: string;
  image: string;
}

export function buildSeedPayload(opts: {
  articlesDir: string;
  categories: CategorySource[];
  faqItems: FaqSeedItem[];
}): SeedPayload {
  const warnings: string[] = [];
  const categories: SeedCategory[] = opts.categories.map((cat, index) => ({
    slug: cat.slug,
    name: cat.name,
    description: cat.description,
    legacyImagePath: cat.image || null,
    position: index,
  }));

  const categorySlugs = new Set(categories.map((c) => c.slug));
  const files = fs
    .readdirSync(opts.articlesDir)
    .filter((name) => name.endsWith(".mdx"))
    .sort();

  const articles: ParsedArticle[] = [];
  for (const file of files) {
    const raw = fs.readFileSync(path.join(opts.articlesDir, file), "utf8");
    const article = parseMdxArticle(file, raw);
    if (!categorySlugs.has(article.categorySlug)) {
      throw new Error(`${file}: categoria desconhecida "${article.categorySlug}"`);
    }
    if (article.slugNormalized) {
      warnings.push(
        `${file}: slug "${article.originalSlug}" normalizado para "${article.slug}" (DB exige ASCII)`,
      );
    }
    articles.push(article);
  }

  const dupKey = new Map<string, string>();
  for (const article of articles) {
    const key = `${article.categorySlug}/${article.slug}`;
    const prev = dupKey.get(key);
    if (prev) {
      throw new Error(`Slug duplicado após normalização: ${key} (${prev} e ${article.sourceFile})`);
    }
    dupKey.set(key, article.sourceFile);
  }

  const pages = buildMarketingPages(
    categories.map((c): CategorySeedItem => ({ slug: c.slug, name: c.name })),
    opts.faqItems,
  );

  return { categories, articles, pages, warnings };
}

export function summarizePayload(payload: SeedPayload): {
  categories: number;
  articles: number;
  pages: number;
  sections: number;
  warnings: number;
} {
  return {
    categories: payload.categories.length,
    articles: payload.articles.length,
    pages: payload.pages.length,
    sections: payload.pages.reduce((sum, page) => sum + page.sections.length, 0),
    warnings: payload.warnings.length,
  };
}
