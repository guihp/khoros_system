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

export async function generateStaticParams() {
  return getAllArticles().map((a) => ({
    category: a.category,
    slug: a.slug,
  }));
}

export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const { category, slug } = await params;
  const article = getArticleBySlug(category, slug);
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
      url: `${siteConfig.url}/blog/${category}/${slug}`,
    },
    alternates: {
      canonical: `/blog/${category}/${slug}`,
    },
  };
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { category, slug } = await params;
  const article = getArticleBySlug(category, slug);
  if (!article) notFound();

  const categoryData = getCategoryBySlug(category);
  const related = getRelatedArticles(article);
  const faqs = article.faq || [];

  return (
    <>
      <JsonLd
        data={[
          articleSchema(article, categoryData?.name || category),
          breadcrumbSchema([
            { name: "Início", url: siteConfig.url },
            { name: "Blog", url: `${siteConfig.url}/blog` },
            {
              name: categoryData?.name || category,
              url: `${siteConfig.url}/blog/categoria/${category}`,
            },
            {
              name: article.title,
              url: `${siteConfig.url}/blog/${category}/${slug}`,
            },
          ]),
          ...(faqs.length > 0 ? [faqPageSchema(faqs)] : []),
        ]}
      />

      <article className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        {article.sensitive && (
          <div className="mb-8">
            <CrisisResources variant="banner" />
          </div>
        )}

        <nav className="text-sm text-khoros-slate mb-6">
          <Link href="/blog" className="hover:text-khoros-cyan-dark">Blog</Link>
          <span className="mx-2">/</span>
          <Link href={`/blog/categoria/${category}`} className="hover:text-khoros-cyan-dark">
            {categoryData?.name}
          </Link>
        </nav>

        {(article.image || categoryData?.image) && (
          <CategoryImage
            src={article.image || categoryData!.image}
            alt={article.imageAlt || categoryData!.imageAlt}
            variant="hero"
            priority
          />
        )}

        <header className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold font-serif leading-tight mb-4">
            {article.title}
          </h1>
          <p className="text-lg text-khoros-slate mb-4">{article.description}</p>
          <div className="flex flex-wrap gap-4 text-sm text-khoros-slate">
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

        <ContentDisclaimer />

        <div className="mt-8">
          <MDXContent source={article.content} />
        </div>

        {article.sources && article.sources.length > 0 && (
          <section className="mt-10 pt-8 border-t border-border">
            <h2 className="text-lg font-semibold mb-3">Fontes e referências</h2>
            <ul className="text-sm text-khoros-slate space-y-1">
              {article.sources.map((source, i) => (
                <li key={i}>{source}</li>
              ))}
            </ul>
          </section>
        )}

        {faqs.length > 0 && (
          <section className="mt-12">
            <h2 className="text-2xl font-semibold mb-6">Perguntas frequentes</h2>
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
          <section className="mt-16">
            <h2 className="text-2xl font-semibold mb-6">Conteúdos relacionados</h2>
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
