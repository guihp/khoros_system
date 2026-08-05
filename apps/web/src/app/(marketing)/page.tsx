import { SectionRenderer } from "@/components/cms/SectionRenderer";
import { fetchCmsPage } from "@/lib/cms/client";

// Conteúdo vem do CMS: renderiza a cada request (a API não existe no docker
// build). `fetchCache` mantém o Data Cache + revalidateTag funcionando.
export const dynamic = "force-dynamic";
export const fetchCache = "default-cache";

export default async function HomePage() {
  const page = await fetchCmsPage("home");
  return <SectionRenderer sections={page.sections} pageSlug="home" />;
}
