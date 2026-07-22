import type { MetadataRoute } from "next";
import { getAllArticles } from "@/lib/blog/content";
import { categories } from "@/lib/blog/categories";
import { siteConfig } from "@/lib/blog/site";

export default function sitemap(): MetadataRoute.Sitemap {
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

  const categoryPages = categories.map((cat) => ({
    url: `${base}/blog/categoria/${cat.slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  const articlePages = getAllArticles().map((article) => ({
    url: `${base}/blog/${article.category}/${article.slug}`,
    lastModified: new Date(article.updatedAt || article.publishedAt),
    changeFrequency: "monthly" as const,
    priority: 0.9,
  }));

  return [...staticPages, ...categoryPages, ...articlePages];
}
