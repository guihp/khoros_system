import type { MetadataRoute } from "next";
import { getAllArticles } from "@/lib/blog/content";
import { getAllCategories } from "@/lib/blog/categories";
import { BLOG_URL, SITE_URL } from "@/lib/hosts";
import { currentHostKind } from "@/lib/request-host";

// Gerado a cada request: no docker build a API não existe e o sitemap ficaria
// congelado só com as páginas estáticas. O fetch do CMS continua cacheado.
export const dynamic = "force-dynamic";
export const fetchCache = "default-cache";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Cada subdomínio publica só as próprias URLs (exigência do Search Console).
  const kind = await currentHostKind();
  if (kind === "app") return [];
  const base = SITE_URL;
  const withSite = kind !== "blog";
  const withBlog = kind !== "site";

  const staticPages = (withSite ? [
    "",
    "/faq",
    "/como-funciona",
    "/sobre",
    "/politicas/privacidade",
    "/politicas/termos",
    "/politicas/aviso",
  ] : []).map((path) => ({
    url: `${base}${path}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: path === "" ? 1 : 0.8,
  }));

  let categoryPages: MetadataRoute.Sitemap = [];
  let articlePages: MetadataRoute.Sitemap = [];

  const blogHome: MetadataRoute.Sitemap = withBlog
    ? [{ url: `${BLOG_URL}/`, lastModified: new Date(), changeFrequency: "daily" as const, priority: 0.9 }]
    : [];

  if (withBlog) try {
    const [categories, articles] = await Promise.all([
      getAllCategories(),
      getAllArticles(),
    ]);
    categoryPages = categories.map((cat) => ({
      url: `${BLOG_URL}/categoria/${cat.slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));
    articlePages = articles.map((article) => ({
      url: `${BLOG_URL}/${article.category}/${article.slug}`,
      lastModified: new Date(article.updatedAt || article.publishedAt),
      changeFrequency: "monthly" as const,
      priority: 0.9,
    }));
  } catch {
    // CMS ainda vazio / API offline — sitemap só com páginas estáticas.
  }

  return [...staticPages, ...blogHome, ...categoryPages, ...articlePages];
}
