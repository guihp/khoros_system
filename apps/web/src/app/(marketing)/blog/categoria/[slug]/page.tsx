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

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <nav className="text-sm text-khoros-slate mb-6">
          <Link href="/blog" className="hover:text-khoros-cyan-dark">Blog</Link>
          <span className="mx-2">/</span>
          <span>{category.name}</span>
        </nav>

        <header className="mb-10">
          <CategoryImage
            src={category.image}
            alt={category.imageAlt}
            variant="hero"
            priority
          />
          <h1 className="text-3xl sm:text-4xl font-bold font-serif mb-3">
            {category.name}
          </h1>
          <p className="text-khoros-slate text-lg max-w-2xl">{category.description}</p>
        </header>

        {articles.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
            {articles.map((article) => (
              <ArticleCard key={article.slug} article={article} />
            ))}
          </div>
        ) : (
          <p className="text-khoros-slate mb-16">Em breve, novos artigos nesta categoria.</p>
        )}

        {faqs.length > 0 && (
          <section>
            <h2 className="text-2xl font-semibold mb-6">Perguntas frequentes sobre {category.name.toLowerCase()}</h2>
            <FAQAccordion items={faqs} />
          </section>
        )}
      </div>
    </>
  );
}
