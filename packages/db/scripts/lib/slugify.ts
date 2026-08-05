/**
 * Normaliza slugs para o check SQL `^[a-z0-9]+(-[a-z0-9]+)*$`.
 * Dois artigos MDX usam acentos (comunicação, traição); o DB exige ASCII.
 */
export function asciiSlug(input: string): string {
  const normalized = input
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");

  if (!normalized || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(normalized)) {
    throw new Error(`Slug inválido após normalização: "${input}" → "${normalized}"`);
  }
  return normalized;
}

/** Aceita `category/slug` ou só `slug`; normaliza cada segmento. */
export function asciiRelatedSlug(input: string): string {
  const parts = input.split("/").map((p) => asciiSlug(p));
  return parts.join("/");
}
