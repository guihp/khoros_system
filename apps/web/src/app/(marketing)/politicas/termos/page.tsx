import type { Metadata } from "next";
import { SectionRenderer } from "@/components/cms/SectionRenderer";
import { fetchCmsPage } from "@/lib/cms/client";

export const metadata: Metadata = {
  title: "Termos de Uso",
  description: "Termos de uso do blog e site da KHOROS.",
};

// Conteúdo vem do CMS: renderiza a cada request (a API não existe no docker
// build). `fetchCache` mantém o Data Cache + revalidateTag funcionando.
export const dynamic = "force-dynamic";
export const fetchCache = "default-cache";

export default async function TermosPage() {
  const page = await fetchCmsPage("politicas-termos");
  return <SectionRenderer sections={page.sections} pageSlug="politicas-termos" />;
}
