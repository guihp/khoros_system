import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getCategoryBySlug, getAllCategories } from "@/lib/blog/categories";
import { getArticlesByCategory } from "@/lib/blog/content";
import { ArticleCard } from "@/components/marketing/ArticleCard";
import { CategoryImage } from "@/components/marketing/CategoryImage";
import { FAQAccordion } from "@/components/marketing/FAQAccordion";
import { JsonLd } from "@/components/marketing/JsonLd";
import { getFaqByCategory } from "@/lib/blog/faq-data";
import { faqPageSchema, breadcrumbSchema } from "@/lib/blog/schema";
import { siteConfig } from "@/lib/blog/site";

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
}

// ISR sob demanda — ver comentário em blog/[category]/[slug]/page.tsx.
export const dynamicParams = true;
export const revalidate = 300;

export async function generateStaticParams() {
  try {
    const categories = await getAllCategories();
    return categories.map((c) => ({ slug: c.slug }));
  } catch {
    // API fora do ar / CMS sem seed: renderiza on-demand.
    return [];
  }
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) return {};

  return {
    title: `${category.name} — Artigos e guias`,
    description: category.description,
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) notFound();

  const articles = await getArticlesByCategory(slug);
  const faqs = getFaqByCategory(slug);

  return (
    <>
      <JsonLd
        data={[
          breadcrumbSchema([
            { name: "Início", url: siteConfig.url },
            { name: "Blog", url: `${siteConfig.url}/blog` },
            { name: category.name, url: `${siteConfig.url}/blog/categoria/${slug}` },
          ]),
          ...(faqs.length > 0 ? [faqPageSchema(faqs)] : []),
        ]}
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 pb-20">
        <nav className="text-sm text-calm-500 mb-8" aria-label="Trilha">
          <Link href="/blog" className="hover:text-brand-700">Blog</Link>
          <span className="mx-2" aria-hidden>/</span>
          <span className="text-calm-800">{category.name}</span>
        </nav>

        <header className="mb-12 grid gap-8 lg:grid-cols-2 items-center">
          <div>
            <p className="eyebrow mb-3">Tema</p>
            <h1 className="text-4xl sm:text-5xl font-semibold text-calm-900 leading-[1.1] mb-4">
              {category.name}
            </h1>
            <p className="text-calm-600 text-lg leading-relaxed max-w-xl">{category.description}</p>
          </div>
          <CategoryImage src={category.image} alt={category.imageAlt} variant="hero" priority />
        </header>

        {articles.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
            {articles.map((article) => (
              <ArticleCard key={article.slug} article={article} />
            ))}
          </div>
        ) : (
          <div className="mb-16 rounded-[var(--radius-card)] bg-white ring-1 ring-calm-200 px-6 py-12 text-center text-calm-600">Em breve, novos artigos neste tema.</div>
        )}

        {faqs.length > 0 && (
          <section>
            <h2 className="text-2xl font-semibold text-calm-900 mb-6">Perguntas frequentes sobre {category.name.toLowerCase()}</h2>
            <FAQAccordion items={faqs} />
          </section>
        )}
      </div>
    </>
  );
}
