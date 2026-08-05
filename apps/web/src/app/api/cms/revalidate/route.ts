import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";
import { CMS_REVALIDATE_PATHS, CMS_TAGS } from "@/lib/cms/tags";

/**
 * On-demand revalidation after CMS publish.
 *
 * Admin (or API webhook) should POST:
 *   Authorization: Bearer <CMS_REVALIDATE_SECRET>
 *   { "tags": ["cms-articles"], "paths": ["/blog"], "pageSlug": "home", "article": { "category": "ansiedade", "slug": "..." } }
 *
 * Env: CMS_REVALIDATE_SECRET (required in production).
 */
const bodySchema = z
  .object({
    tags: z.array(z.string().min(1).max(120)).max(40).optional(),
    paths: z.array(z.string().min(1).max(500)).max(40).optional(),
    pageSlug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).optional(),
    article: z
      .object({
        category: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
        slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
      })
      .optional(),
    all: z.boolean().optional(),
  })
  .strict();

function authorize(req: Request): boolean {
  const secret = process.env.CMS_REVALIDATE_SECRET;
  if (!secret) {
    // Dev-friendly: allow without secret only when unset (document for prod).
    return process.env.NODE_ENV !== "production";
  }
  const header = req.headers.get("authorization");
  return header === `Bearer ${secret}`;
}

export async function POST(req: Request) {
  if (!authorize(req)) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "VALIDATION", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const tags = new Set<string>(parsed.data.tags ?? []);
  const paths = new Set<string>(parsed.data.paths ?? []);

  if (parsed.data.all) {
    tags.add(CMS_TAGS.all);
    tags.add(CMS_TAGS.pages);
    tags.add(CMS_TAGS.articles);
    tags.add(CMS_TAGS.categories);
    for (const path of CMS_REVALIDATE_PATHS) paths.add(path);
  }

  if (parsed.data.pageSlug) {
    tags.add(CMS_TAGS.page(parsed.data.pageSlug));
    tags.add(CMS_TAGS.pages);
    const slugToPath: Record<string, string> = {
      home: "/",
      sobre: "/sobre",
      "como-funciona": "/como-funciona",
      faq: "/faq",
      "politicas-privacidade": "/politicas/privacidade",
      "politicas-termos": "/politicas/termos",
      "politicas-aviso": "/politicas/aviso",
    };
    const path = slugToPath[parsed.data.pageSlug];
    if (path) paths.add(path);
  }

  if (parsed.data.article) {
    const { category, slug } = parsed.data.article;
    tags.add(CMS_TAGS.article(category, slug));
    tags.add(CMS_TAGS.articles);
    paths.add("/blog");
    paths.add(`/blog/${category}/${slug}`);
    paths.add(`/blog/categoria/${category}`);
  }

  if (tags.size === 0 && paths.size === 0) {
    tags.add(CMS_TAGS.all);
  }

  for (const tag of tags) revalidateTag(tag);
  for (const path of paths) revalidatePath(path);

  return NextResponse.json({
    revalidated: true,
    tags: [...tags],
    paths: [...paths],
    now: Date.now(),
  });
}
