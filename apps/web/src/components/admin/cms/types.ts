/**
 * Tipos usados pelo slice de páginas/seções.
 * Reexporta os contratos CMS do web lib para evitar drift.
 */
export type {
  CmsPage as CmsPageRow,
  CmsPageSection,
  CmsListResponse,
  CmsMedia,
  CmsCategory,
  CmsArticle,
} from "@/lib/cms-types";

import type { CmsPage } from "@/lib/cms-types";

/** Resposta tipada do GET /admin/cms/pages */
export type CmsPagesListResponse = { items: CmsPage[] };
