import type { Metadata } from "next";
import { FAQAccordion } from "@/components/marketing/FAQAccordion";
import { CategoryImage } from "@/components/marketing/CategoryImage";
import { JsonLd } from "@/components/marketing/JsonLd";
import { faqItems } from "@/lib/blog/faq-data";
import { faqPageSchema } from "@/lib/blog/schema";
import { categories } from "@/lib/blog/categories";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Perguntas frequentes (FAQ)",
  description:
    "Respostas acolhedoras sobre terapia, ansiedade, burnout, relacionamentos e saúde emocional.",
};

export default function FAQPage() {
  const grouped = categories
    .map((cat) => ({
      category: cat,
      items: faqItems.filter((f) => f.category === cat.slug),
    }))
    .filter((g) => g.items.length > 0);

  return (
    <>
      <JsonLd data={faqPageSchema(faqItems)} />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        <h1 className="text-3xl sm:text-4xl font-bold font-serif mb-4">
          Perguntas frequentes
        </h1>
        <p className="text-khoros-slate text-lg mb-10">
          Respostas profundas e acolhedoras sobre os temas mais buscados em saúde mental.
        </p>

        <div className="space-y-12">
          {grouped.map(({ category, items }) => (
            <section key={category.slug} id={category.slug}>
              <div className="flex items-center gap-4 mb-4">
                <CategoryImage
                  src={category.image}
                  alt={category.imageAlt}
                  variant="thumb"
                />
                <div className="flex-1 flex items-center justify-between gap-4">
                  <h2 className="text-xl font-semibold">{category.name}</h2>
                  <Link
                    href={`/blog/categoria/${category.slug}`}
                    className="text-sm text-khoros-cyan-dark hover:underline shrink-0"
                  >
                    Ver artigos
                  </Link>
                </div>
              </div>
              <FAQAccordion items={items} id={`faq-${category.slug}`} />
            </section>
          ))}
        </div>
      </div>
    </>
  );
}
