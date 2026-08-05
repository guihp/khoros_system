import type { Metadata } from "next";
import { JsonLd } from "@/components/marketing/JsonLd";
import { SectionRenderer } from "@/components/cms/SectionRenderer";
import { fetchCmsPage } from "@/lib/cms/client";
import { faqPageSchema } from "@/lib/blog/schema";

export const metadata: Metadata = {
  title: "Perguntas frequentes (FAQ)",
  description:
    "Respostas acolhedoras sobre terapia, ansiedade, burnout, relacionamentos e saúde emocional.",
};

export default async function FAQPage() {
  const page = await fetchCmsPage("faq");
  const faqItems = page.sections
    .filter((s) => s.type === "faq")
    .flatMap((s) => (s.type === "faq" ? s.config.items : []));

  return (
    <>
      {faqItems.length > 0 && <JsonLd data={faqPageSchema(faqItems)} />}
      <SectionRenderer sections={page.sections} pageSlug="faq" />
    </>
  );
}
