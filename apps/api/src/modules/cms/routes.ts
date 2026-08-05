import { randomUUID } from "node:crypto";
import type { FastifyInstance, FastifyReply } from "fastify";
import { cmsSectionSchema, CMS_CONTENT_STATUSES } from "@khoros/shared";
import { z } from "zod";
import { notifyCmsRevalidate } from "../../lib/cms-revalidate.js";

const CMS_MEDIA_BUCKET = "cms-media";
const CMS_MEDIA_MAX_BYTES = 5 * 1024 * 1024;
const CMS_MEDIA_EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};

const idSchema = z.string().uuid();
const slugSchema = z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const statusSchema = z.enum(CMS_CONTENT_STATUSES);
const nullableIdSchema = idSchema.nullable();
const nullableText = (max: number) => z.string().trim().min(1).max(max).nullable();

const categoryCreateSchema = z.object({
  slug: slugSchema,
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().min(1).max(1000),
  imageMediaId: nullableIdSchema.optional(),
  legacyImagePath: nullableText(2048).optional(),
  position: z.number().int().min(0).default(0),
  status: statusSchema.default("DRAFT"),
}).strict();
const categoryUpdateSchema = categoryCreateSchema.partial();

const faqItemSchema = z.object({
  question: z.string().trim().min(1).max(300),
  answer: z.string().trim().min(1).max(5000),
}).strict();
const articleCreateSchema = z.object({
  categoryId: idSchema,
  slug: slugSchema,
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().min(1).max(500),
  bodyMdx: z.string().trim().min(1).max(500_000),
  status: statusSchema.default("DRAFT"),
  author: z.string().trim().min(1).max(160),
  reviewer: nullableText(160).optional(),
  reviewerCrp: nullableText(40).optional(),
  heroMediaId: nullableIdSchema.optional(),
  legacyImagePath: nullableText(2048).optional(),
  imageAlt: nullableText(500).optional(),
  sensitive: z.boolean().default(false),
  sources: z.array(z.string().trim().min(1).max(2048)).max(100).default([]),
  faq: z.array(faqItemSchema).max(50).default([]),
  relatedSlugs: z.array(slugSchema).max(30).default([]),
  publishedAt: z.string().datetime().nullable().optional(),
}).strict().superRefine((value, ctx) => {
  if (value.reviewerCrp && !value.reviewer) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["reviewer"], message: "Revisor é obrigatório quando há CRP." });
  }
});
const articleUpdateSchema = z.object({
  categoryId: idSchema.optional(),
  slug: slugSchema.optional(),
  title: z.string().trim().min(1).max(200).optional(),
  description: z.string().trim().min(1).max(500).optional(),
  bodyMdx: z.string().trim().min(1).max(500_000).optional(),
  status: statusSchema.optional(),
  author: z.string().trim().min(1).max(160).optional(),
  reviewer: nullableText(160).optional(),
  reviewerCrp: nullableText(40).optional(),
  heroMediaId: nullableIdSchema.optional(),
  legacyImagePath: nullableText(2048).optional(),
  imageAlt: nullableText(500).optional(),
  sensitive: z.boolean().optional(),
  sources: z.array(z.string().trim().min(1).max(2048)).max(100).optional(),
  faq: z.array(faqItemSchema).max(50).optional(),
  relatedSlugs: z.array(slugSchema).max(30).optional(),
  publishedAt: z.string().datetime().nullable().optional(),
}).strict();

const pageCreateSchema = z.object({
  slug: slugSchema,
  title: z.string().trim().min(1).max(200),
  status: statusSchema.default("DRAFT"),
  publishedAt: z.string().datetime().nullable().optional(),
}).strict();
const pageUpdateSchema = pageCreateSchema.partial();

const sectionFieldsSchema = z.object({
  position: z.number().int().min(0),
  isVisible: z.boolean().default(true),
}).strict();
const sectionUpdateFieldsSchema = z.object({
  position: z.number().int().min(0).optional(),
  isVisible: z.boolean().optional(),
  type: z.string().optional(),
  config: z.unknown().optional(),
}).strict().superRefine((value, ctx) => {
  if ((value.type === undefined) !== (value.config === undefined)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["config"],
      message: "type e config devem ser enviados juntos.",
    });
  }
});
const reorderSchema = z.object({
  sectionIds: z.array(idSchema).min(1).max(100),
}).strict().superRefine((value, ctx) => {
  if (new Set(value.sectionIds).size !== value.sectionIds.length) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["sectionIds"], message: "IDs duplicados." });
  }
});

const mediaMetadataSchema = z.object({
  altText: z.string().trim().min(1).max(500),
  status: statusSchema.default("DRAFT"),
}).strict();

function validationError(reply: FastifyReply, error: z.ZodError) {
  return reply.code(400).send({ error: "VALIDATION", issues: error.issues });
}

function databaseError(reply: FastifyReply, code: string, error: { message: string }) {
  return reply.code(500).send({ error: code, message: error.message });
}

function categoryRow(value: z.infer<typeof categoryUpdateSchema>) {
  return {
    ...(value.slug !== undefined && { slug: value.slug }),
    ...(value.name !== undefined && { name: value.name }),
    ...(value.description !== undefined && { description: value.description }),
    ...(value.imageMediaId !== undefined && { image_media_id: value.imageMediaId }),
    ...(value.legacyImagePath !== undefined && { legacy_image_path: value.legacyImagePath }),
    ...(value.position !== undefined && { position: value.position }),
    ...(value.status !== undefined && { status: value.status }),
  };
}

function articleRow(value: z.infer<typeof articleUpdateSchema>) {
  const publishedAt =
    value.status === "PUBLISHED" && !value.publishedAt
      ? new Date().toISOString()
      : value.publishedAt;
  return {
    ...(value.categoryId !== undefined && { category_id: value.categoryId }),
    ...(value.slug !== undefined && { slug: value.slug }),
    ...(value.title !== undefined && { title: value.title }),
    ...(value.description !== undefined && { description: value.description }),
    ...(value.bodyMdx !== undefined && { body_mdx: value.bodyMdx }),
    ...(value.status !== undefined && { status: value.status }),
    ...(value.author !== undefined && { author: value.author }),
    ...(value.reviewer !== undefined && { reviewer: value.reviewer }),
    ...(value.reviewerCrp !== undefined && { reviewer_crp: value.reviewerCrp }),
    ...(value.heroMediaId !== undefined && { hero_media_id: value.heroMediaId }),
    ...(value.legacyImagePath !== undefined && { legacy_image_path: value.legacyImagePath }),
    ...(value.imageAlt !== undefined && { image_alt: value.imageAlt }),
    ...(value.sensitive !== undefined && { sensitive: value.sensitive }),
    ...(value.sources !== undefined && { sources: value.sources }),
    ...(value.faq !== undefined && { faq: value.faq }),
    ...(value.relatedSlugs !== undefined && { related_slugs: value.relatedSlugs }),
    ...(publishedAt !== undefined && { published_at: publishedAt }),
  };
}

function pageRow(value: z.infer<typeof pageUpdateSchema>) {
  const publishedAt =
    value.status === "PUBLISHED" && !value.publishedAt
      ? new Date().toISOString()
      : value.publishedAt;
  return {
    ...(value.slug !== undefined && { slug: value.slug }),
    ...(value.title !== undefined && { title: value.title }),
    ...(value.status !== undefined && { status: value.status }),
    ...(publishedAt !== undefined && { published_at: publishedAt }),
  };
}

function parseId(value: unknown, reply: FastifyReply): string | undefined {
  const parsed = idSchema.safeParse(value);
  if (!parsed.success) {
    validationError(reply, parsed.error);
    return undefined;
  }
  return parsed.data;
}

async function revalidatePublishedArticle(
  app: FastifyInstance,
  article: { status: string; slug: string; category?: { slug?: string } | null },
): Promise<void> {
  const categorySlug = article.category?.slug;
  if (article.status !== "PUBLISHED" || !categorySlug) return;
  await notifyCmsRevalidate(app.env, app.log, {
    article: { category: categorySlug, slug: article.slug },
  });
}

async function revalidatePublishedPage(
  app: FastifyInstance,
  page: { status: string; slug: string } | null | undefined,
): Promise<void> {
  if (!page || page.status !== "PUBLISHED") return;
  await notifyCmsRevalidate(app.env, app.log, { pageSlug: page.slug });
}

async function loadPageForRevalidate(app: FastifyInstance, pageId: string) {
  const { data } = await app.supabase
    .from("cms_pages")
    .select("slug, status")
    .eq("id", pageId)
    .maybeSingle();
  return data as { slug: string; status: string } | null;
}

export async function registerCmsRoutes(app: FastifyInstance): Promise<void> {
  app.get("/cms/pages/:slug", async (req, reply) => {
    const parsedSlug = slugSchema.safeParse((req.params as { slug?: unknown }).slug);
    if (!parsedSlug.success) return validationError(reply, parsedSlug.error);

    const { data: page, error } = await app.supabase
      .from("cms_pages")
      .select("*")
      .eq("slug", parsedSlug.data)
      .eq("status", "PUBLISHED")
      .maybeSingle();
    if (error) return databaseError(reply, "QUERY_FAILED", error);
    if (!page) return reply.code(404).send({ error: "NOT_FOUND" });

    const { data: sections, error: sectionsError } = await app.supabase
      .from("cms_page_sections")
      .select("*")
      .eq("page_id", page.id)
      .eq("is_visible", true)
      .order("position", { ascending: true });
    if (sectionsError) return databaseError(reply, "QUERY_FAILED", sectionsError);
    return reply.send({ ...page, sections: sections ?? [] });
  });

  app.get("/cms/articles", async (req, reply) => {
    const querySchema = z.object({ category: slugSchema.optional() }).strict();
    const parsed = querySchema.safeParse(req.query);
    if (!parsed.success) return validationError(reply, parsed.error);

    // hero_media is optional (legacy_image_path may be used instead) — do not filter it as required.
    let query = app.supabase
      .from("cms_articles")
      .select("*, category:cms_categories!inner(*), hero_media:cms_media(*)")
      .eq("status", "PUBLISHED")
      .eq("category.status", "PUBLISHED");
    if (parsed.data.category) query = query.eq("category.slug", parsed.data.category);
    const { data, error } = await query.order("published_at", { ascending: false });
    if (error) return databaseError(reply, "QUERY_FAILED", error);
    return reply.send({ items: data ?? [] });
  });

  app.get("/cms/articles/:category/:slug", async (req, reply) => {
    const parsed = z.object({ category: slugSchema, slug: slugSchema }).safeParse(req.params);
    if (!parsed.success) return validationError(reply, parsed.error);
    const { data, error } = await app.supabase
      .from("cms_articles")
      .select("*, category:cms_categories!inner(*), hero_media:cms_media(*)")
      .eq("slug", parsed.data.slug)
      .eq("status", "PUBLISHED")
      .eq("category.slug", parsed.data.category)
      .eq("category.status", "PUBLISHED")
      .maybeSingle();
    if (error) return databaseError(reply, "QUERY_FAILED", error);
    if (!data) return reply.code(404).send({ error: "NOT_FOUND" });
    return reply.send(data);
  });

  app.get("/cms/categories", async (_req, reply) => {
    // image_media is optional (legacy_image_path may be used instead).
    const { data, error } = await app.supabase
      .from("cms_categories")
      .select("*, image_media:cms_media(*)")
      .eq("status", "PUBLISHED")
      .order("position", { ascending: true })
      .order("name", { ascending: true });
    if (error) return databaseError(reply, "QUERY_FAILED", error);
    return reply.send({ items: data ?? [] });
  });

  const adminOnly = { preHandler: app.requireRole("ADMIN") };

  app.get("/admin/cms/categories", adminOnly, async (_req, reply) => {
    const { data, error } = await app.supabase.from("cms_categories").select("*").order("position");
    if (error) return databaseError(reply, "QUERY_FAILED", error);
    return reply.send({ items: data ?? [] });
  });
  app.get("/admin/cms/categories/:id", adminOnly, async (req, reply) => {
    const id = parseId((req.params as { id?: unknown }).id, reply);
    if (!id) return;
    const { data, error } = await app.supabase.from("cms_categories").select("*").eq("id", id).maybeSingle();
    if (error) return databaseError(reply, "QUERY_FAILED", error);
    if (!data) return reply.code(404).send({ error: "NOT_FOUND" });
    return reply.send(data);
  });
  app.post("/admin/cms/categories", adminOnly, async (req, reply) => {
    if (!req.authUser) return reply.code(401).send({ error: "UNAUTHENTICATED" });
    const parsed = categoryCreateSchema.safeParse(req.body);
    if (!parsed.success) return validationError(reply, parsed.error);
    const { data, error } = await app.supabase
      .from("cms_categories")
      .insert({ ...categoryRow(parsed.data), created_by: req.authUser.id })
      .select("*")
      .single();
    if (error) return databaseError(reply, "CREATE_FAILED", error);
    return reply.code(201).send(data);
  });
  app.patch("/admin/cms/categories/:id", adminOnly, async (req, reply) => {
    const id = parseId((req.params as { id?: unknown }).id, reply);
    if (!id) return;
    const parsed = categoryUpdateSchema.safeParse(req.body);
    if (!parsed.success) return validationError(reply, parsed.error);
    const { data, error } = await app.supabase
      .from("cms_categories").update(categoryRow(parsed.data)).eq("id", id).select("*").maybeSingle();
    if (error) return databaseError(reply, "UPDATE_FAILED", error);
    if (!data) return reply.code(404).send({ error: "NOT_FOUND" });
    if (data.status === "PUBLISHED" || parsed.data.status !== undefined) {
      void notifyCmsRevalidate(app.env, app.log, { tags: ["cms-categories", "cms-articles"], paths: ["/blog"] });
    }
    return reply.send(data);
  });
  app.delete("/admin/cms/categories/:id", adminOnly, async (req, reply) => {
    const id = parseId((req.params as { id?: unknown }).id, reply);
    if (!id) return;
    const { data, error } = await app.supabase.from("cms_categories").delete().eq("id", id).select("id").maybeSingle();
    if (error) return databaseError(reply, "DELETE_FAILED", error);
    if (!data) return reply.code(404).send({ error: "NOT_FOUND" });
    return reply.code(204).send();
  });

  app.get("/admin/cms/articles", adminOnly, async (req, reply) => {
    const parsed = z.object({ status: statusSchema.optional(), categoryId: idSchema.optional() }).strict().safeParse(req.query);
    if (!parsed.success) return validationError(reply, parsed.error);
    let query = app.supabase
      .from("cms_articles")
      .select("*, category:cms_categories(*), hero_media:cms_media(*)");
    if (parsed.data.status) query = query.eq("status", parsed.data.status);
    if (parsed.data.categoryId) query = query.eq("category_id", parsed.data.categoryId);
    const { data, error } = await query.order("updated_at", { ascending: false });
    if (error) return databaseError(reply, "QUERY_FAILED", error);
    return reply.send({ items: data ?? [] });
  });
  app.get("/admin/cms/articles/:id", adminOnly, async (req, reply) => {
    const id = parseId((req.params as { id?: unknown }).id, reply);
    if (!id) return;
    const { data, error } = await app.supabase
      .from("cms_articles").select("*, category:cms_categories(*), hero_media:cms_media(*)").eq("id", id).maybeSingle();
    if (error) return databaseError(reply, "QUERY_FAILED", error);
    if (!data) return reply.code(404).send({ error: "NOT_FOUND" });
    return reply.send(data);
  });
  app.post("/admin/cms/articles", adminOnly, async (req, reply) => {
    if (!req.authUser) return reply.code(401).send({ error: "UNAUTHENTICATED" });
    const parsed = articleCreateSchema.safeParse(req.body);
    if (!parsed.success) return validationError(reply, parsed.error);
    const { data, error } = await app.supabase
      .from("cms_articles")
      .insert({ ...articleRow(parsed.data), created_by: req.authUser.id })
      .select("*, category:cms_categories(slug)")
      .single();
    if (error) return databaseError(reply, "CREATE_FAILED", error);
    void revalidatePublishedArticle(app, data);
    return reply.code(201).send(data);
  });
  app.patch("/admin/cms/articles/:id", adminOnly, async (req, reply) => {
    const id = parseId((req.params as { id?: unknown }).id, reply);
    if (!id) return;
    const parsed = articleUpdateSchema.safeParse(req.body);
    if (!parsed.success) return validationError(reply, parsed.error);
    const { data, error } = await app.supabase
      .from("cms_articles")
      .update(articleRow(parsed.data))
      .eq("id", id)
      .select("*, category:cms_categories(slug)")
      .maybeSingle();
    if (error) return databaseError(reply, "UPDATE_FAILED", error);
    if (!data) return reply.code(404).send({ error: "NOT_FOUND" });
    void revalidatePublishedArticle(app, data);
    return reply.send(data);
  });
  app.delete("/admin/cms/articles/:id", adminOnly, async (req, reply) => {
    const id = parseId((req.params as { id?: unknown }).id, reply);
    if (!id) return;
    const { data: existing } = await app.supabase
      .from("cms_articles")
      .select("status, slug, category:cms_categories(slug)")
      .eq("id", id)
      .maybeSingle();
    const { data, error } = await app.supabase.from("cms_articles").delete().eq("id", id).select("id").maybeSingle();
    if (error) return databaseError(reply, "DELETE_FAILED", error);
    if (!data) return reply.code(404).send({ error: "NOT_FOUND" });
    if (existing) void revalidatePublishedArticle(app, existing as { status: string; slug: string; category?: { slug?: string } | null });
    return reply.code(204).send();
  });

  app.get("/admin/cms/pages", adminOnly, async (_req, reply) => {
    const { data, error } = await app.supabase.from("cms_pages").select("*").order("updated_at", { ascending: false });
    if (error) return databaseError(reply, "QUERY_FAILED", error);
    return reply.send({ items: data ?? [] });
  });
  app.get("/admin/cms/pages/:id", adminOnly, async (req, reply) => {
    const id = parseId((req.params as { id?: unknown }).id, reply);
    if (!id) return;
    const { data, error } = await app.supabase.from("cms_pages").select("*").eq("id", id).maybeSingle();
    if (error) return databaseError(reply, "QUERY_FAILED", error);
    if (!data) return reply.code(404).send({ error: "NOT_FOUND" });
    return reply.send(data);
  });
  app.post("/admin/cms/pages", adminOnly, async (req, reply) => {
    if (!req.authUser) return reply.code(401).send({ error: "UNAUTHENTICATED" });
    const parsed = pageCreateSchema.safeParse(req.body);
    if (!parsed.success) return validationError(reply, parsed.error);
    const { data, error } = await app.supabase
      .from("cms_pages")
      .insert({ ...pageRow(parsed.data), created_by: req.authUser.id })
      .select("*")
      .single();
    if (error) return databaseError(reply, "CREATE_FAILED", error);
    void revalidatePublishedPage(app, data);
    return reply.code(201).send(data);
  });
  app.patch("/admin/cms/pages/:id", adminOnly, async (req, reply) => {
    const id = parseId((req.params as { id?: unknown }).id, reply);
    if (!id) return;
    const parsed = pageUpdateSchema.safeParse(req.body);
    if (!parsed.success) return validationError(reply, parsed.error);
    const { data, error } = await app.supabase
      .from("cms_pages").update(pageRow(parsed.data)).eq("id", id).select("*").maybeSingle();
    if (error) return databaseError(reply, "UPDATE_FAILED", error);
    if (!data) return reply.code(404).send({ error: "NOT_FOUND" });
    void revalidatePublishedPage(app, data);
    return reply.send(data);
  });
  app.delete("/admin/cms/pages/:id", adminOnly, async (req, reply) => {
    const id = parseId((req.params as { id?: unknown }).id, reply);
    if (!id) return;
    const existing = await loadPageForRevalidate(app, id);
    const { data, error } = await app.supabase.from("cms_pages").delete().eq("id", id).select("id").maybeSingle();
    if (error) return databaseError(reply, "DELETE_FAILED", error);
    if (!data) return reply.code(404).send({ error: "NOT_FOUND" });
    void revalidatePublishedPage(app, existing);
    return reply.code(204).send();
  });

  app.get("/admin/cms/pages/:pageId/sections", adminOnly, async (req, reply) => {
    const pageId = parseId((req.params as { pageId?: unknown }).pageId, reply);
    if (!pageId) return;
    const { data, error } = await app.supabase
      .from("cms_page_sections").select("*").eq("page_id", pageId).order("position");
    if (error) return databaseError(reply, "QUERY_FAILED", error);
    return reply.send({ items: data ?? [] });
  });
  app.post("/admin/cms/pages/:pageId/sections", adminOnly, async (req, reply) => {
    const pageId = parseId((req.params as { pageId?: unknown }).pageId, reply);
    if (!pageId) return;
    const body = req.body as Record<string, unknown> | null;
    const section = cmsSectionSchema.safeParse({ type: body?.type, config: body?.config });
    const fields = sectionFieldsSchema.safeParse({ position: body?.position, isVisible: body?.isVisible });
    if (!section.success) return validationError(reply, section.error);
    if (!fields.success) return validationError(reply, fields.error);
    const { data, error } = await app.supabase
      .from("cms_page_sections")
      .insert({
        page_id: pageId,
        type: section.data.type,
        config: section.data.config,
        position: fields.data.position,
        is_visible: fields.data.isVisible,
      })
      .select("*")
      .single();
    if (error) return databaseError(reply, "CREATE_FAILED", error);
    void loadPageForRevalidate(app, pageId).then((page) => revalidatePublishedPage(app, page));
    return reply.code(201).send(data);
  });
  app.patch("/admin/cms/sections/:id", adminOnly, async (req, reply) => {
    const id = parseId((req.params as { id?: unknown }).id, reply);
    if (!id) return;
    const fields = sectionUpdateFieldsSchema.safeParse(req.body);
    if (!fields.success) return validationError(reply, fields.error);
    let typedSection: z.infer<typeof cmsSectionSchema> | undefined;
    if (fields.data.type !== undefined) {
      const parsedSection = cmsSectionSchema.safeParse({ type: fields.data.type, config: fields.data.config });
      if (!parsedSection.success) return validationError(reply, parsedSection.error);
      typedSection = parsedSection.data;
    }
    const patch = {
      ...(fields.data.position !== undefined && { position: fields.data.position }),
      ...(fields.data.isVisible !== undefined && { is_visible: fields.data.isVisible }),
      ...(typedSection && { type: typedSection.type, config: typedSection.config }),
    };
    const { data, error } = await app.supabase
      .from("cms_page_sections").update(patch).eq("id", id).select("*").maybeSingle();
    if (error) return databaseError(reply, "UPDATE_FAILED", error);
    if (!data) return reply.code(404).send({ error: "NOT_FOUND" });
    void loadPageForRevalidate(app, data.page_id as string).then((page) => revalidatePublishedPage(app, page));
    return reply.send(data);
  });
  app.delete("/admin/cms/sections/:id", adminOnly, async (req, reply) => {
    const id = parseId((req.params as { id?: unknown }).id, reply);
    if (!id) return;
    const { data: existing } = await app.supabase
      .from("cms_page_sections")
      .select("page_id")
      .eq("id", id)
      .maybeSingle();
    const { data, error } = await app.supabase.from("cms_page_sections").delete().eq("id", id).select("id").maybeSingle();
    if (error) return databaseError(reply, "DELETE_FAILED", error);
    if (!data) return reply.code(404).send({ error: "NOT_FOUND" });
    if (existing?.page_id) {
      void loadPageForRevalidate(app, existing.page_id as string).then((page) =>
        revalidatePublishedPage(app, page),
      );
    }
    return reply.code(204).send();
  });
  app.put("/admin/cms/pages/:pageId/sections/reorder", adminOnly, async (req, reply) => {
    const pageId = parseId((req.params as { pageId?: unknown }).pageId, reply);
    if (!pageId) return;
    const parsed = reorderSchema.safeParse(req.body);
    if (!parsed.success) return validationError(reply, parsed.error);

    const { data: existing, error: queryError } = await app.supabase
      .from("cms_page_sections").select("id").eq("page_id", pageId);
    if (queryError) return databaseError(reply, "QUERY_FAILED", queryError);
    const existingIds = (existing ?? []).map((row) => row.id as string);
    if (
      existingIds.length !== parsed.data.sectionIds.length
      || existingIds.some((id) => !parsed.data.sectionIds.includes(id))
    ) {
      return reply.code(400).send({
        error: "VALIDATION",
        message: "A ordem deve conter exatamente todas as seções da página.",
      });
    }

    for (const [position, id] of parsed.data.sectionIds.entries()) {
      const { error } = await app.supabase
        .from("cms_page_sections").update({ position: 1_000_000 + position }).eq("id", id).eq("page_id", pageId);
      if (error) return databaseError(reply, "REORDER_FAILED", error);
    }
    for (const [position, id] of parsed.data.sectionIds.entries()) {
      const { error } = await app.supabase
        .from("cms_page_sections").update({ position }).eq("id", id).eq("page_id", pageId);
      if (error) return databaseError(reply, "REORDER_FAILED", error);
    }
    void loadPageForRevalidate(app, pageId).then((page) => revalidatePublishedPage(app, page));
    return reply.send({ sectionIds: parsed.data.sectionIds });
  });

  app.get("/admin/cms/media", adminOnly, async (_req, reply) => {
    const { data, error } = await app.supabase.from("cms_media").select("*").order("created_at", { ascending: false });
    if (error) return databaseError(reply, "QUERY_FAILED", error);
    return reply.send({ items: data ?? [] });
  });
  app.post("/admin/cms/media", adminOnly, async (req, reply) => {
    if (!req.authUser) return reply.code(401).send({ error: "UNAUTHENTICATED" });
    const file = await req.file();
    if (!file) {
      return reply.code(400).send({ error: "VALIDATION", message: "Envie o arquivo no campo `file`." });
    }
    const extension = CMS_MEDIA_EXTENSIONS[file.mimetype];
    if (!extension) {
      return reply.code(400).send({ error: "VALIDATION", message: "Use JPEG, PNG, WebP ou AVIF." });
    }
    const buffer = await file.toBuffer();
    if (buffer.byteLength > CMS_MEDIA_MAX_BYTES) {
      return reply.code(400).send({ error: "VALIDATION", message: "A imagem deve ter no máximo 5 MB." });
    }
    const fieldValue = (name: string): string | undefined => {
      const field = file.fields[name];
      return field && "value" in field && typeof field.value === "string" ? field.value : undefined;
    };
    const metadata = mediaMetadataSchema.safeParse({
      altText: fieldValue("altText"),
      status: fieldValue("status") ?? "DRAFT",
    });
    if (!metadata.success) return validationError(reply, metadata.error);

    const storagePath = `${req.authUser.id}/${randomUUID()}.${extension}`;
    const { error: uploadError } = await app.supabase.storage
      .from(CMS_MEDIA_BUCKET)
      .upload(storagePath, buffer, { contentType: file.mimetype, upsert: false, cacheControl: "31536000" });
    if (uploadError) return databaseError(reply, "UPLOAD_FAILED", uploadError);

    const { data, error } = await app.supabase
      .from("cms_media")
      .insert({
        storage_path: storagePath,
        alt_text: metadata.data.altText,
        mime_type: file.mimetype,
        size_bytes: buffer.byteLength,
        status: metadata.data.status,
        created_by: req.authUser.id,
      })
      .select("*")
      .single();
    if (error) {
      await app.supabase.storage.from(CMS_MEDIA_BUCKET).remove([storagePath]);
      return databaseError(reply, "CREATE_FAILED", error);
    }
    return reply.code(201).send(data);
  });
}
