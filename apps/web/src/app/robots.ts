import type { MetadataRoute } from "next";
import { BLOG_URL, SITE_URL } from "@/lib/hosts";
import { currentHostKind } from "@/lib/request-host";

export const dynamic = "force-dynamic";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const kind = await currentHostKind();
  // O sistema (app.) é área logada: nada para indexar.
  if (kind === "app") return { rules: { userAgent: "*", disallow: "/" } };
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/api/"] },
    sitemap: `${kind === "blog" ? BLOG_URL : SITE_URL}/sitemap.xml`,
  };
}
