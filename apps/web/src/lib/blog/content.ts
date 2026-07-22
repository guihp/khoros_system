import fs from "fs";
import path from "path";
import matter from "gray-matter";
import readingTime from "reading-time";

const articlesDirectory = path.join(process.cwd(), "content/articles");

export interface ArticleFAQ {
  question: string;
  answer: string;
}

export interface ArticleFrontmatter {
  title: string;
  description: string;
  category: string;
  slug: string;
  publishedAt: string;
  updatedAt?: string;
  author: string;
  reviewer?: string;
  reviewerCrp?: string;
  image?: string;
  imageAlt?: string;
  sensitive?: boolean;
  sources?: string[];
  faq?: ArticleFAQ[];
  relatedSlugs?: string[];
}

export interface Article extends ArticleFrontmatter {
  content: string;
  readingTime: string;
}

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

export function getAllArticles(): Article[] {
  if (!fs.existsSync(articlesDirectory)) return [];

  const files = fs.readdirSync(articlesDirectory).filter((f) => f.endsWith(".mdx"));

  return files
    .map(parseArticle)
    .sort(
      (a, b) =>
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    );
}

export function getArticleBySlug(
  category: string,
  slug: string
): Article | undefined {
  return getAllArticles().find(
    (a) => a.category === category && a.slug === slug
  );
}

export function getArticlesByCategory(category: string): Article[] {
  return getAllArticles().filter((a) => a.category === category);
}

export function getRelatedArticles(article: Article, limit = 3): Article[] {
  const all = getAllArticles().filter(
    (a) => !(a.category === article.category && a.slug === article.slug)
  );

  const related = article.relatedSlugs
    ? all.filter((a) => article.relatedSlugs?.includes(`${a.category}/${a.slug}`))
    : all.filter((a) => a.category === article.category);

  return related.slice(0, limit);
}
