import { Source_Serif_4 } from "next/font/google";
import { Header } from "@/components/marketing/Header";
import { Footer } from "@/components/marketing/Footer";
import { Analytics } from "@/components/marketing/Analytics";
import { JsonLd } from "@/components/marketing/JsonLd";
import { organizationSchema } from "@/lib/blog/schema";

const sourceSerif = Source_Serif_4({
  variable: "--font-source-serif",
  subsets: ["latin"],
  weight: ["400", "600"],
});

/**
 * Shell de marketing (blog Onda 0): Header/Footer próprios, sem AppNav da app.
 * Rotas autenticadas continuam com AppShell no layout raiz.
 */
export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${sourceSerif.variable} flex min-h-0 flex-1 flex-col`}>
      <JsonLd data={organizationSchema()} />
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <Analytics />
    </div>
  );
}
