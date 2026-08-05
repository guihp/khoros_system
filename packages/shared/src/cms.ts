import { z } from "zod";

export const CMS_CONTENT_STATUSES = ["DRAFT", "PUBLISHED"] as const;
export const CMS_SECTION_TYPES = [
  "hero",
  "category_grid",
  "article_list",
  "rich_text",
  "cta_band",
  "faq",
  "steps",
  "crisis_banner",
  "validation_block",
  "disclaimer",
] as const;

export type CmsContentStatus = (typeof CMS_CONTENT_STATUSES)[number];
export type CmsSectionType = (typeof CMS_SECTION_TYPES)[number];

const text = (max: number) => z.string().trim().min(1).max(max);
const slug = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const safeHref = z
  .string()
  .trim()
  .max(2048)
  .refine((value) => value.startsWith("/") || /^https:\/\//i.test(value), {
    message: "Use um caminho interno ou uma URL HTTPS.",
  });

const buttonSchema = z
  .object({
    label: text(80),
    href: safeHref,
    variant: z.enum(["primary", "secondary", "link"]).optional(),
  })
  .strict();

const heroConfigSchema = z
  .object({
    eyebrow: text(120).optional(),
    title: text(160),
    subtitle: text(500).optional(),
    ctas: z.array(buttonSchema).max(3).default([]),
  })
  .strict();

const categoryGridConfigSchema = z
  .object({
    title: text(160).optional(),
    limit: z.number().int().min(1).max(24).optional(),
  })
  .strict();

const articleListConfigSchema = z
  .object({
    title: text(160).optional(),
    limit: z.number().int().min(1).max(24).optional(),
    categorySlug: slug.optional(),
  })
  .strict();

const richTextConfigSchema = z.object({ markdown: text(100_000) }).strict();

const ctaBandConfigSchema = z
  .object({
    title: text(160),
    text: text(1000).optional(),
    buttons: z.array(buttonSchema).min(1).max(3),
  })
  .strict();

const faqConfigSchema = z
  .object({
    title: text(160).optional(),
    items: z
      .array(z.object({ question: text(300), answer: text(5000) }).strict())
      .min(1)
      .max(50),
  })
  .strict();

const stepsConfigSchema = z
  .object({
    title: text(160).optional(),
    items: z
      .array(z.object({ title: text(160), text: text(1000) }).strict())
      .min(1)
      .max(12),
  })
  .strict();

const crisisBannerConfigSchema = z
  .object({
    title: text(160),
    text: text(1000),
    showCvv: z.boolean().default(true),
    showSamu: z.boolean().default(true),
    showEmergency: z.boolean().default(true),
    showCaps: z.boolean().default(true),
  })
  .strict();

const validationBlockConfigSchema = z
  .object({
    title: text(160),
    text: text(2000),
    formId: text(120).optional(),
    cta: buttonSchema.optional(),
  })
  .strict();

const disclaimerConfigSchema = z
  .object({
    title: text(160).optional(),
    text: text(5000),
  })
  .strict();

export const cmsSectionSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("hero"), config: heroConfigSchema }).strict(),
  z.object({ type: z.literal("category_grid"), config: categoryGridConfigSchema }).strict(),
  z.object({ type: z.literal("article_list"), config: articleListConfigSchema }).strict(),
  z.object({ type: z.literal("rich_text"), config: richTextConfigSchema }).strict(),
  z.object({ type: z.literal("cta_band"), config: ctaBandConfigSchema }).strict(),
  z.object({ type: z.literal("faq"), config: faqConfigSchema }).strict(),
  z.object({ type: z.literal("steps"), config: stepsConfigSchema }).strict(),
  z.object({ type: z.literal("crisis_banner"), config: crisisBannerConfigSchema }).strict(),
  z.object({ type: z.literal("validation_block"), config: validationBlockConfigSchema }).strict(),
  z.object({ type: z.literal("disclaimer"), config: disclaimerConfigSchema }).strict(),
]);

export type CmsSection = z.infer<typeof cmsSectionSchema>;
export type CmsSectionConfig<T extends CmsSectionType> = Extract<CmsSection, { type: T }>["config"];
