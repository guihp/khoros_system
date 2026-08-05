import type { Metadata } from "next";
import { SectionRenderer } from "@/components/cms/SectionRenderer";
import { fetchCmsPage } from "@/lib/cms/client";

export const metadata: Metadata = {
  title: "Como a KHOROS vai funcionar",
  description:
    "Conheça a proposta da KHOROS: consultoria instantânea por vídeo com especialistas em saúde mental, paga por minuto, sem agendamento.",
};

// Conteúdo vem do CMS: renderiza a cada request (a API não existe no docker
// build). `fetchCache` mantém o Data Cache + revalidateTag funcionando.
export const dynamic = "force-dynamic";
export const fetchCache = "default-cache";

export default async function ComoFuncionaPage() {
  const page = await fetchCmsPage("como-funciona");
  return <SectionRenderer sections={page.sections} pageSlug="como-funciona" />;
}
