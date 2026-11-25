import { CmsEmptyError, fetchCmsCategories, resolveCmsImage } from "@/lib/cms/client";
import {
  categoriesLegacy,
  type Category,
} from "@/lib/blog/categories-legacy";

export type { Category };

/** @deprecated Prefer getAllCategories(); kept for seed/docs parity. */
export const categories = categoriesLegacy;
export const categoriesLegacyBackup = categoriesLegacy;

export async function getAllCategories(): Promise<Category[]> {
  let rows: Awaited<ReturnType<typeof fetchCmsCategories>>;
  try {
    rows = await fetchCmsCategories();
  } catch (err) {
    if (err instanceof CmsEmptyError) {
      console.warn(`[cms] ${err.message}`);
      return [];
    }
    throw err;
  }
  return rows.map((row) => {
    const image = resolveCmsImage(row.legacy_image_path, row.image_media);
    return {
      slug: row.slug,
      name: row.name,
      description: row.description,
      image: image.src || `/images/categories/${row.slug}.jpg`,
      imageAlt: image.alt || row.name,
    };
  });
}

export async function getCategoryBySlug(slug: string): Promise<Category | undefined> {
  const all = await getAllCategories();
  return all.find((c) => c.slug === slug);
}
