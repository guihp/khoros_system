/** Cache tags for on-demand revalidation after CMS publish. */
export const CMS_TAGS = {
  all: "cms",
  pages: "cms-pages",
  page: (slug: string) => `cms-page:${slug}`,
  articles: "cms-articles",
  article: (category: string, slug: string) => `cms-article:${category}/${slug}`,
  categories: "cms-categories",
} as const;

/** Paths to revalidate when content changes (admin can POST these via /api/cms/revalidate). */
export const CMS_REVALIDATE_PATHS = [
  "/",
  "/blog",
  "/faq",
  "/como-funciona",
  "/sobre",
  "/politicas/privacidade",
  "/politicas/termos",
  "/politicas/aviso",
] as const;
