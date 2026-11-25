import { Header } from "@/components/marketing/Header";
import { Footer } from "@/components/marketing/Footer";
import { Analytics } from "@/components/marketing/Analytics";
import { PageViewTracker } from "@/components/marketing/PageViewTracker";
import { JsonLd } from "@/components/marketing/JsonLd";
import { organizationSchema } from "@/lib/blog/schema";

/**
 * Shell de marketing (blog Onda 0): Header/Footer próprios, sem AppNav da app.
 * Rotas autenticadas continuam com AppShell no layout raiz.
 */
export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col bg-calm-50">
      <JsonLd data={organizationSchema()} />
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <Analytics />
      <PageViewTracker />
    </div>
  );
}
