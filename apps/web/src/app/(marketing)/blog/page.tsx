import { Suspense } from "react";
import type { Metadata } from "next";
import { getAllArticles } from "@/lib/blog/content";
import { ArticleCard } from "@/components/marketing/ArticleCard";
import { CategoryFilter } from "@/components/marketing/CategoryFilter";
import { siteConfig } from "@/lib/blog/site";

export const metadata: Metadata = {
  title: "Blog — Saúde mental e psicologia",
  description:
    "Artigos sobre ansiedade, burnout, terapia, autoestima e mais. Conteúdo acolhedor e baseado em evidências.",
};

interface BlogPageProps {
  searchParams: Promise<{ categoria?: string }>;
}

export default async function BlogPage({ searchParams }: BlogPageProps) {
  const { categoria } = await searchParams;
  const allArticles = getAllArticles();
  const articles = categoria
    ? allArticles.filter((a) => a.category === categoria)
    : allArticles;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
      <header className="mb-10">
        <h1 className="text-3xl sm:text-4xl font-bold font-serif mb-3">Blog</h1>
        <p className="text-khoros-slate text-lg max-w-2xl">
          Conteúdo sobre saúde mental para educar, acolher e ajudar você a tomar
          decisões informadas sobre o seu bem-estar.
        </p>
      </header>

      <Suspense fallback={<div className="h-10" />}>
        <CategoryFilter />
      </Suspense>

      {articles.length === 0 ? (
        <p className="text-khoros-slate">Nenhum artigo encontrado nesta categoria.</p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {articles.map((article) => (
            <ArticleCard key={`${article.category}-${article.slug}`} article={article} />
          ))}
        </div>
      )}
    </div>
  );
}
