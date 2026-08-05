import type { CmsContentStatus, CmsSectionType } from "@khoros/shared";

/** Respostas CMS admin — campos snake_case espelhando Postgres/Supabase. */

export interface CmsMedia {
  id: string;
  storage_path: string;
  alt_text: string;
  mime_type: string;
  size_bytes: number;
  status: CmsContentStatus;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CmsCategory {
  id: string;
  slug: string;
  name: string;
  description: string;
  image_media_id: string | null;
  legacy_image_path: string | null;
  position: number;
  status: CmsContentStatus;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CmsArticleFaqItem {
  question: string;
  answer: string;
}

export interface CmsArticle {
  id: string;
  category_id: string;
  slug: string;
  title: string;
  description: string;
  body_mdx: string;
  status: CmsContentStatus;
  author: string;
  reviewer: string | null;
  reviewer_crp: string | null;
  hero_media_id: string | null;
  legacy_image_path: string | null;
  image_alt: string | null;
  sensitive: boolean;
  sources: string[];
  faq: CmsArticleFaqItem[];
  related_slugs: string[];
  published_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  category?: CmsCategory | null;
  hero_media?: CmsMedia | null;
}

export interface CmsPage {
  id: string;
  slug: string;
  title: string;
  status: CmsContentStatus;
  published_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CmsPageSection {
  id: string;
  page_id: string;
  type: CmsSectionType;
  position: number;
  is_visible: boolean;
  config: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface CmsListResponse<T> {
  items: T[];
}

export type CmsArticleInput = {
  categoryId: string;
  slug: string;
  title: string;
  description: string;
  bodyMdx: string;
  status: CmsContentStatus;
  author: string;
  reviewer?: string | null;
  reviewerCrp?: string | null;
  heroMediaId?: string | null;
  legacyImagePath?: string | null;
  imageAlt?: string | null;
  sensitive: boolean;
  sources: string[];
  faq: CmsArticleFaqItem[];
  relatedSlugs: string[];
};

export type CmsCategoryInput = {
  slug: string;
  name: string;
  description: string;
  imageMediaId?: string | null;
  legacyImagePath?: string | null;
  position: number;
  status: CmsContentStatus;
};
