import type { Metadata } from "next";
import { SectionRenderer } from "@/components/cms/SectionRenderer";
import { fetchCmsPage } from "@/lib/cms/client";

export const metadata: Metadata = {
  title: "Política de Privacidade (LGPD)",
  description: "Como a KHOROS coleta, usa e protege seus dados pessoais.",
};

// Conteúdo vem do CMS: renderiza a cada request (a API não existe no docker
// build). `fetchCache` mantém o Data Cache + revalidateTag funcionando.
export const dynamic = "force-dynamic";
export const fetchCache = "default-cache";

export default async function PrivacidadePage() {
  const page = await fetchCmsPage("politicas-privacidade");
  return <SectionRenderer sections={page.sections} pageSlug="politicas-privacidade" />;
}
