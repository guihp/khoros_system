import type { MetadataRoute } from "next";
import { getAllArticles } from "@/lib/blog/content";
import { getAllCategories } from "@/lib/blog/categories";
import { siteConfig } from "@/lib/blog/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteConfig.url;

  const staticPages = [
    "",
    "/blog",
    "/faq",
    "/como-funciona",
    "/sobre",
    "/politicas/privacidade",
    "/politicas/termos",
    "/politicas/aviso",
  ].map((path) => ({
    url: `${base}${path}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: path === "" ? 1 : 0.8,
  }));

  let categoryPages: MetadataRoute.Sitemap = [];
  let articlePages: MetadataRoute.Sitemap = [];

  try {
    const [categories, articles] = await Promise.all([
      getAllCategories(),
      getAllArticles(),
    ]);
    categoryPages = categories.map((cat) => ({
      url: `${base}/blog/categoria/${cat.slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));
    articlePages = articles.map((article) => ({
      url: `${base}/blog/${article.category}/${article.slug}`,
      lastModified: new Date(article.updatedAt || article.publishedAt),
      changeFrequency: "monthly" as const,
      priority: 0.9,
    }));
  } catch {
    // CMS ainda vazio / API offline — sitemap só com páginas estáticas.
  }

  return [...staticPages, ...categoryPages, ...articlePages];
}
