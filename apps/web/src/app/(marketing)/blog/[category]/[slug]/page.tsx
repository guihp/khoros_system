import { BLOG_URL, blogHref } from "@/lib/hosts";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  getAllArticles,
  getArticleBySlug,
  getRelatedArticles,
} from "@/lib/blog/content";
import { getCategoryBySlug } from "@/lib/blog/categories";
import { CategoryImage } from "@/components/marketing/CategoryImage";
import { MDXContent } from "@/components/marketing/MDXContent";
import { ValidationBlock } from "@/components/marketing/ValidationBlock";
import { FAQAccordion } from "@/components/marketing/FAQAccordion";
import { ContentDisclaimer } from "@/components/marketing/ContentDisclaimer";
import { CrisisResources } from "@/components/marketing/CrisisResources";
import { ArticleCard } from "@/components/marketing/ArticleCard";
import { JsonLd } from "@/components/marketing/JsonLd";
import { articleSchema, breadcrumbSchema, faqPageSchema } from "@/lib/blog/schema";
import { siteConfig } from "@/lib/blog/site";

interface ArticlePageProps {
  params: Promise<{ category: string; slug: string }>;
}

// ISR sob demanda: nada é pré-renderizado se a API não estiver acessível no
// build (caso do docker build). A página é gerada e cacheada no primeiro
// request e invalidada por /api/cms/revalidate (tags) ou pelo TTL abaixo.
export const dynamicParams = true;
export const revalidate = 300;

export async function generateStaticParams() {
  try {
    const articles = await getAllArticles();
    return articles.map((a) => ({
      category: a.category,
      slug: a.slug,
    }));
  } catch {
    // API fora do ar / CMS sem seed: renderiza on-demand.
    return [];
  }
}

export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const { category, slug } = await params;
  const article = await getArticleBySlug(category, slug);
  if (!article) return {};

  return {
    title: article.title,
    description: article.description,
    openGraph: {
      title: article.title,
      description: article.description,
      type: "article",
      publishedTime: article.publishedAt,
      modifiedTime: article.updatedAt || article.publishedAt,
      url: `${BLOG_URL}/${category}/${slug}`,
    },
    alternates: {
      canonical: `${BLOG_URL}/${category}/${slug}`,
    },
  };
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { category, slug } = await params;
  const article = await getArticleBySlug(category, slug);
  if (!article) notFound();

  const categoryData = await getCategoryBySlug(category);
  const related = await getRelatedArticles(article);
  const faqs = article.faq || [];
  const categoryName = article.categoryName || categoryData?.name || category;

  return (
    <>
      <JsonLd
        data={[
          articleSchema(article, categoryName),
          breadcrumbSchema([
            { name: "Início", url: siteConfig.url },
            { name: "Blog", url: `${BLOG_URL}` },
            {
              name: categoryName,
              url: `${BLOG_URL}/categoria/${category}`,
            },
            {
              name: article.title,
              url: `${BLOG_URL}/${category}/${slug}`,
            },
          ]),
          ...(faqs.length > 0 ? [faqPageSchema(faqs)] : []),
        ]}
      />

      <article className="max-w-3xl mx-auto px-4 sm:px-6 pt-8 pb-20">
        {article.sensitive && (
          <div className="mb-8">
            <CrisisResources variant="banner" />
          </div>
        )}

        <nav className="text-sm text-calm-500 mb-8" aria-label="Trilha">
          <Link href={blogHref("/")} className="hover:text-brand-700">Blog</Link>
          <span className="mx-2" aria-hidden>/</span>
          <Link href={blogHref(`/categoria/${category}`)} className="hover:text-brand-700">
            {categoryName}
          </Link>
        </nav>

        <header className="mb-10">
          <span className="inline-block rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-brand-700 mb-5">
            {categoryName}
          </span>
          <h1 className="text-[2.1rem] sm:text-5xl font-semibold text-calm-900 leading-[1.12] mb-5">
            {article.title}
          </h1>
          <p className="text-xl text-calm-600 leading-relaxed mb-6">{article.description}</p>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-calm-500 pb-8 border-b border-calm-200">
            <time dateTime={article.publishedAt}>
              {format(new Date(article.publishedAt), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </time>
            <span>·</span>
            <span>{article.readingTime}</span>
            {article.reviewer && (
              <>
                <span>·</span>
                <span>
                  Revisado por {article.reviewer}
                  {article.reviewerCrp && ` (CRP ${article.reviewerCrp})`}
                </span>
              </>
            )}
          </div>
        </header>

        {(article.image || categoryData?.image) && (
          <CategoryImage
            src={article.image || categoryData!.image}
            alt={article.imageAlt || categoryData!.imageAlt}
            variant="hero"
            className="mb-10"
            priority
          />
        )}


        <ContentDisclaimer />

        <div className="mt-10">
          <MDXContent source={article.content} variant="article" />
        </div>

        {article.sources && article.sources.length > 0 && (
          <section className="mt-10 pt-8 border-t border-border">
            <h2 className="text-base font-semibold text-calm-900 mb-3">Fontes e referências</h2>
            <ul className="text-sm text-calm-600 space-y-1">
              {article.sources.map((source, i) => (
                <li key={i}>{source}</li>
              ))}
            </ul>
          </section>
        )}

        {faqs.length > 0 && (
          <section className="mt-12">
            <h2 className="text-2xl font-semibold text-calm-900 mb-6">Perguntas frequentes</h2>
            <FAQAccordion items={faqs} />
          </section>
        )}

        <ValidationBlock
          articleSlug={slug}
          articleCategory={category}
          articleTitle={article.title}
        />

        <CrisisResources variant="inline" />

        {related.length > 0 && (
          <section className="mt-20 pt-12 border-t border-calm-200">
            <p className="eyebrow mb-2">Continue lendo</p>
            <h2 className="text-2xl font-semibold text-calm-900 mb-8">Conteúdos relacionados</h2>
            <div className="grid sm:grid-cols-2 gap-6">
              {related.map((rel) => (
                <ArticleCard key={`${rel.category}-${rel.slug}`} article={rel} />
              ))}
            </div>
          </section>
        )}
      </article>
    </>
  );
}
