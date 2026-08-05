import type { Metadata } from "next";
import { SectionRenderer } from "@/components/cms/SectionRenderer";
import { fetchCmsPage } from "@/lib/cms/client";

export const metadata: Metadata = {
  title: "Aviso de Conteúdo",
  description: "Avisos sobre a natureza informativa do conteúdo de saúde mental da KHOROS.",
};

// Conteúdo vem do CMS: renderiza a cada request (a API não existe no docker
// build). `fetchCache` mantém o Data Cache + revalidateTag funcionando.
export const dynamic = "force-dynamic";
export const fetchCache = "default-cache";

export default async function AvisoPage() {
  const page = await fetchCmsPage("politicas-aviso");
  return <SectionRenderer sections={page.sections} pageSlug="politicas-aviso" />;
}
