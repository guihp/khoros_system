import { Suspense } from "react";
import type { Metadata } from "next";
import { BLOG_URL } from "@/lib/hosts";
import { getAllArticles } from "@/lib/blog/content";
import { getAllCategories } from "@/lib/blog/categories";
import { ArticleCard } from "@/components/marketing/ArticleCard";
import { CategoryFilter } from "@/components/marketing/CategoryFilter";

export const metadata: Metadata = {
  alternates: { canonical: `${BLOG_URL}/` },
  title: "Blog — Saúde mental e psicologia",
  description:
    "Artigos sobre ansiedade, burnout, terapia, autoestima e mais. Conteúdo acolhedor e baseado em evidências.",
};

// Índice do blog vem do CMS: renderiza a cada request (a API não existe no
// docker build). `fetchCache` mantém o Data Cache + revalidateTag funcionando.
export const dynamic = "force-dynamic";
export const fetchCache = "default-cache";

interface BlogPageProps {
  searchParams: Promise<{ categoria?: string }>;
}

export default async function BlogPage({ searchParams }: BlogPageProps) {
  const { categoria } = await searchParams;
  const [allArticles, categories] = await Promise.all([
    getAllArticles(),
    getAllCategories(),
  ]);
  const publishedSlugs = new Set(allArticles.map((a) => a.category));
  const visibleCategories = categories.filter((c) => publishedSlugs.has(c.slug));
  const articles = categoria
    ? allArticles.filter((a) => a.category === categoria)
    : allArticles;

  return (
    <div>
      <section className="atmosphere-hero -mt-[72px] pt-[72px]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-14 pb-10 sm:pt-20">
          <p className="eyebrow mb-4">Blog KHOROS</p>
          <h1 className="text-4xl sm:text-5xl font-semibold text-calm-900 max-w-3xl leading-[1.1]">
            Conteúdo para cuidar da sua saúde emocional
          </h1>
          <p className="mt-5 text-calm-600 text-lg max-w-2xl leading-relaxed">
            Textos acolhedores e baseados em evidências para você entender melhor o que sente e
            tomar decisões informadas sobre o seu bem-estar.
          </p>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-20">
        <Suspense fallback={<div className="h-10 mb-10" />}>
          <CategoryFilter categories={visibleCategories} />
        </Suspense>

        {articles.length === 0 ? (
          <div className="rounded-[var(--radius-card)] bg-white ring-1 ring-calm-200 px-6 py-16 text-center">
            <p className="font-display text-xl text-calm-900">Novos conteúdos em breve</p>
            <p className="mt-2 text-calm-600">
              {categoria
                ? "Ainda não há artigos publicados neste tema."
                : "Estamos preparando os primeiros artigos."}
            </p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map((article, i) => (
              <ArticleCard
                key={`${article.category}-${article.slug}`}
                article={article}
                featured={i === 0 && !categoria && articles.length > 2}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
