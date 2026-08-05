import { SectionRenderer } from "@/components/cms/SectionRenderer";
import { fetchCmsPage } from "@/lib/cms/client";

export default async function HomePage() {
  const page = await fetchCmsPage("home");
  return <SectionRenderer sections={page.sections} pageSlug="home" />;
}
