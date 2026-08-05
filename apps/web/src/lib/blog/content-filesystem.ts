/**
 * BACKUP — filesystem MDX loader (não é mais a fonte de verdade).
 * Artigos em `content/articles/*.mdx` permanecem no repo até validar produção.
 * Use `content.ts` (CMS API) em runtime.
 */
import fs from "fs";
import path from "path";
import matter from "gray-matter";
import readingTime from "reading-time";
import type { Article, ArticleFrontmatter } from "./content";

const articlesDirectory = path.join(process.cwd(), "content/articles");

function parseArticle(filename: string): Article {
  const filePath = path.join(articlesDirectory, filename);
  const fileContents = fs.readFileSync(filePath, "utf8");
  const { data, content } = matter(fileContents);
  const stats = readingTime(content);

  return {
    ...(data as ArticleFrontmatter),
    content,
    readingTime: stats.text,
  };
}

/** @deprecated Use getAllArticles() from content.ts (CMS). */
export function getAllArticlesFromFilesystem(): Article[] {
  if (!fs.existsSync(articlesDirectory)) return [];

  const files = fs.readdirSync(articlesDirectory).filter((f) => f.endsWith(".mdx"));

  return files
    .map(parseArticle)
    .sort(
      (a, b) =>
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
    );
}
