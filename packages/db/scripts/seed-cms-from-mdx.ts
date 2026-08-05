#!/usr/bin/env node
/**
 * One-shot: migra categorias + 84 MDX + páginas marketing → cms_*.
 *
 * Uso:
 *   DATABASE_URL=postgres://... pnpm --filter @khoros/db seed:cms
 *   pnpm --filter @khoros/db seed:cms:dry
 *
 * Idempotente: upsert por slug (categorias/páginas/artigos).
 * Seções de página: delete + reinsert por page_id a cada run.
 *
 * Flags:
 *   --dry-run   parse + valida seções; não escreve no DB
 *   --apply     exige DATABASE_URL e grava
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import pg from "pg";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { buildSeedPayload, summarizePayload, type SeedPayload } from "./lib/build-seed-payload.js";
import type { FaqSeedItem } from "./lib/marketing-pages.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../../..");
const articlesDir = path.join(repoRoot, "apps/web/content/articles");

function hasFlag(name: string): boolean {
  return process.argv.includes(name);
}

async function loadWebSources(): Promise<{
  categories: Array<{ slug: string; name: string; description: string; image: string }>;
  faqItems: FaqSeedItem[];
}> {
  // Categories live in packages/db (seed must not import Next `@/` aliases).
  const { seedCategories } = await import("./lib/seed-categories.js");
  const faqUrl = pathToFileURL(path.join(repoRoot, "apps/web/src/lib/blog/faq-data.ts")).href;
  const { faqItems } = (await import(faqUrl)) as { faqItems: FaqSeedItem[] };
  return { categories: seedCategories, faqItems };
}

async function applySeed(client: pg.Client, payload: SeedPayload): Promise<void> {
  await client.query("begin");
  try {
    const categoryIds = new Map<string, string>();

    for (const cat of payload.categories) {
      const { rows } = await client.query<{ id: string }>(
        `insert into cms_categories (
           slug, name, description, legacy_image_path, position, status
         ) values ($1, $2, $3, $4, $5, 'PUBLISHED')
         on conflict (slug) do update set
           name = excluded.name,
           description = excluded.description,
           legacy_image_path = excluded.legacy_image_path,
           position = excluded.position,
           status = 'PUBLISHED',
           updated_at = now()
         returning id`,
        [cat.slug, cat.name, cat.description, cat.legacyImagePath, cat.position],
      );
      const id = rows[0]?.id;
      if (!id) throw new Error(`Falha ao upsert categoria ${cat.slug}`);
      categoryIds.set(cat.slug, id);
    }

    for (const article of payload.articles) {
      const categoryId = categoryIds.get(article.categorySlug);
      if (!categoryId) {
        throw new Error(`Categoria não encontrada para ${article.sourceFile}`);
      }
      await client.query(
        `insert into cms_articles (
           category_id, slug, title, description, body_mdx, status,
           author, reviewer, reviewer_crp, legacy_image_path, image_alt,
           sensitive, sources, faq, related_slugs, published_at
         ) values (
           $1, $2, $3, $4, $5, 'PUBLISHED',
           $6, $7, $8, $9, $10,
           $11, $12, $13::jsonb, $14, $15
         )
         on conflict (category_id, slug) do update set
           title = excluded.title,
           description = excluded.description,
           body_mdx = excluded.body_mdx,
           status = 'PUBLISHED',
           author = excluded.author,
           reviewer = excluded.reviewer,
           reviewer_crp = excluded.reviewer_crp,
           legacy_image_path = excluded.legacy_image_path,
           image_alt = excluded.image_alt,
           sensitive = excluded.sensitive,
           sources = excluded.sources,
           faq = excluded.faq,
           related_slugs = excluded.related_slugs,
           published_at = excluded.published_at,
           updated_at = now()`,
        [
          categoryId,
          article.slug,
          article.title,
          article.description,
          article.bodyMdx,
          article.author,
          article.reviewer,
          article.reviewerCrp,
          article.legacyImagePath,
          article.imageAlt,
          article.sensitive,
          article.sources,
          JSON.stringify(article.faq),
          article.relatedSlugs,
          article.publishedAt.toISOString(),
        ],
      );
    }

    for (const page of payload.pages) {
      const { rows } = await client.query<{ id: string }>(
        `insert into cms_pages (slug, title, status, published_at)
         values ($1, $2, 'PUBLISHED', now())
         on conflict (slug) do update set
           title = excluded.title,
           status = 'PUBLISHED',
           published_at = coalesce(cms_pages.published_at, excluded.published_at),
           updated_at = now()
         returning id`,
        [page.slug, page.title],
      );
      const pageId = rows[0]?.id;
      if (!pageId) throw new Error(`Falha ao upsert página ${page.slug}`);

      await client.query(`delete from cms_page_sections where page_id = $1`, [pageId]);

      for (const section of page.sections) {
        await client.query(
          `insert into cms_page_sections (page_id, type, position, is_visible, config)
           values ($1, $2, $3, $4, $5::jsonb)`,
          [
            pageId,
            section.type,
            section.position,
            section.isVisible,
            JSON.stringify(section.config),
          ],
        );
      }
    }

    await client.query("commit");
  } catch (err) {
    await client.query("rollback");
    throw err;
  }
}

async function applySeedViaSupabase(supabase: SupabaseClient, payload: SeedPayload): Promise<void> {
  const categoryIds = new Map<string, string>();

  for (const cat of payload.categories) {
    const { data, error } = await supabase
      .from("cms_categories")
      .upsert(
        {
          slug: cat.slug,
          name: cat.name,
          description: cat.description,
          legacy_image_path: cat.legacyImagePath,
          position: cat.position,
          status: "PUBLISHED",
        },
        { onConflict: "slug" },
      )
      .select("id")
      .single();
    if (error || !data?.id) {
      throw new Error(`Falha ao upsert categoria ${cat.slug}: ${error?.message ?? "sem id"}`);
    }
    categoryIds.set(cat.slug, data.id as string);
  }

  for (const article of payload.articles) {
    const categoryId = categoryIds.get(article.categorySlug);
    if (!categoryId) {
      throw new Error(`Categoria não encontrada para ${article.sourceFile}`);
    }
    const { error } = await supabase.from("cms_articles").upsert(
      {
        category_id: categoryId,
        slug: article.slug,
        title: article.title,
        description: article.description,
        body_mdx: article.bodyMdx,
        status: "PUBLISHED",
        author: article.author,
        reviewer: article.reviewer,
        reviewer_crp: article.reviewerCrp,
        legacy_image_path: article.legacyImagePath,
        image_alt: article.imageAlt,
        sensitive: article.sensitive,
        sources: article.sources,
        faq: article.faq,
        related_slugs: article.relatedSlugs,
        published_at: article.publishedAt.toISOString(),
      },
      { onConflict: "category_id,slug" },
    );
    if (error) {
      throw new Error(`Falha ao upsert artigo ${article.slug}: ${error.message}`);
    }
  }

  for (const page of payload.pages) {
    const { data: pageRow, error: pageError } = await supabase
      .from("cms_pages")
      .upsert(
        {
          slug: page.slug,
          title: page.title,
          status: "PUBLISHED",
          published_at: new Date().toISOString(),
        },
        { onConflict: "slug" },
      )
      .select("id")
      .single();
    if (pageError || !pageRow?.id) {
      throw new Error(`Falha ao upsert página ${page.slug}: ${pageError?.message ?? "sem id"}`);
    }
    const pageId = pageRow.id as string;

    const { error: deleteError } = await supabase
      .from("cms_page_sections")
      .delete()
      .eq("page_id", pageId);
    if (deleteError) {
      throw new Error(`Falha ao limpar seções de ${page.slug}: ${deleteError.message}`);
    }

    if (page.sections.length === 0) continue;
    const { error: sectionError } = await supabase.from("cms_page_sections").insert(
      page.sections.map((section) => ({
        page_id: pageId,
        type: section.type,
        position: section.position,
        is_visible: section.isVisible,
        config: section.config,
      })),
    );
    if (sectionError) {
      throw new Error(`Falha ao inserir seções de ${page.slug}: ${sectionError.message}`);
    }
  }
}

async function connectPg(url: string): Promise<pg.Client | null> {
  const client = new pg.Client({
    connectionString: url,
    ssl: url.includes("supabase.co") ? { rejectUnauthorized: false } : undefined,
  });
  try {
    await client.connect();
    return client;
  } catch (err) {
    console.warn(
      `⚠ DATABASE_URL falhou (${err instanceof Error ? err.message : String(err)}). Tentando SUPABASE_URL + SUPABASE_SECRET_KEY…`,
    );
    return null;
  }
}

async function main(): Promise<void> {
  // Default: dry-run. Writes only with --apply (or SEED_CMS_APPLY=1), unless --dry-run wins.
  const shouldApply =
    (hasFlag("--apply") || process.env.SEED_CMS_APPLY === "1") && !hasFlag("--dry-run");
  const write = shouldApply;

  if (!fs.existsSync(articlesDir)) {
    console.error(`Diretório de artigos não encontrado: ${articlesDir}`);
    process.exit(1);
  }

  console.log(`→ carregando seed-categories + faq-data.ts`);
  const { categories, faqItems } = await loadWebSources();

  console.log(`→ parseando MDX em ${articlesDir}`);
  const payload = buildSeedPayload({ articlesDir, categories, faqItems });
  const summary = summarizePayload(payload);

  console.log("\nResumo:");
  console.log(`  categories: ${summary.categories}`);
  console.log(`  articles:   ${summary.articles}`);
  console.log(`  pages:      ${summary.pages}`);
  console.log(`  sections:   ${summary.sections}`);
  console.log(`  warnings:   ${summary.warnings}`);

  for (const warning of payload.warnings) {
    console.warn(`  ! ${warning}`);
  }

  for (const page of payload.pages) {
    console.log(`  page ${page.slug}: ${page.sections.length} seções (${page.sections.map((s) => s.type).join(", ")})`);
  }

  if (!write) {
    console.log("\nDry-run OK — nenhum write. Use --apply (e DATABASE_URL ou SUPABASE_*) para gravar.");
    return;
  }

  const databaseUrl = process.env.DATABASE_URL;
  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SECRET_KEY;

  let applied = false;

  if (databaseUrl) {
    const client = await connectPg(databaseUrl);
    if (client) {
      try {
        const tables = await client.query<{ exists: boolean }>(
          `select to_regclass('public.cms_articles') is not null as exists`,
        );
        if (!tables.rows[0]?.exists) {
          console.error(
            "Tabelas cms_* não encontradas. Aplique packages/db/migrations/0006_cms.sql antes (pnpm --filter @khoros/db migrate).",
          );
          process.exit(1);
        }
        console.log("\n→ gravando no Postgres via DATABASE_URL (upsert por slug)...");
        await applySeed(client, payload);
        applied = true;
        console.log("✓ seed CMS concluído");
      } finally {
        await client.end();
      }
    }
  }

  if (!applied) {
    if (!supabaseUrl || !supabaseKey) {
      console.error(
        "Não foi possível gravar: DATABASE_URL inválida e faltam SUPABASE_URL + SUPABASE_SECRET_KEY.",
      );
      process.exit(1);
    }
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { error: probe } = await supabase.from("cms_articles").select("id").limit(1);
    if (probe) {
      console.error(
        `Supabase probe falhou (${probe.message}). Confirme migration 0006 e a secret key.`,
      );
      process.exit(1);
    }
    console.log("\n→ gravando via Supabase client (upsert por slug)...");
    await applySeedViaSupabase(supabase, payload);
    console.log("✓ seed CMS concluído");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});