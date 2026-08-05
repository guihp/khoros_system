import type { Metadata } from "next";
import { SectionRenderer } from "@/components/cms/SectionRenderer";
import { fetchCmsPage } from "@/lib/cms/client";

export const metadata: Metadata = {
  title: "Sobre — Autoridade e E-E-A-T",
  description:
    "Conheça a equipe por trás do blog KHOROS, nossa abordagem editorial e compromisso com conteúdo de saúde mental baseado em evidências.",
};

// Conteúdo vem do CMS: renderiza a cada request (a API não existe no docker
// build). `fetchCache` mantém o Data Cache + revalidateTag funcionando.
export const dynamic = "force-dynamic";
export const fetchCache = "default-cache";

export default async function SobrePage() {
  const page = await fetchCmsPage("sobre");
  return <SectionRenderer sections={page.sections} pageSlug="sobre" />;
}
