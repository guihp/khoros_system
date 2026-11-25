import type { Metadata } from "next";
import localFont from "next/font/local";
import { SupportBanner } from "@/components/SupportBanner";
import { AppShell } from "@/components/AppShell";
import { AuthProvider } from "@/lib/auth-context";
import { siteConfig } from "@/lib/blog/site";
import "./globals.css";

// Fontes hospedadas no próprio projeto (variáveis, subset latin): build não
// depende do Google Fonts e o visitante não faz requisição a terceiros (LGPD).
const montserrat = localFont({
  src: [{ path: "../fonts/montserrat-normal.woff2", weight: "500 700", style: "normal" }],
  variable: "--font-heading",
  display: "swap",
});

const sourceSerif = localFont({
  src: [
    { path: "../fonts/sourceserif4-normal.woff2", weight: "200 900", style: "normal" },
    { path: "../fonts/sourceserif4-italic.woff2", weight: "200 900", style: "italic" },
  ],
  variable: "--font-reading",
  display: "swap",
});

const dmSans = localFont({
  src: [
    { path: "../fonts/dmsans-normal.woff2", weight: "100 1000", style: "normal" },
    { path: "../fonts/dmsans-italic.woff2", weight: "100 1000", style: "italic" },
  ],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `${siteConfig.name} — Saúde mental e psicologia`,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  openGraph: {
    type: "website",
    locale: siteConfig.locale,
    url: siteConfig.url,
    siteName: siteConfig.name,
    title: siteConfig.name,
    description: siteConfig.description,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${montserrat.variable} ${dmSans.variable} ${sourceSerif.variable}`}>
      <body className="min-h-dvh flex flex-col">
        <SupportBanner />
        <AuthProvider>
          <AppShell>{children}</AppShell>
        </AuthProvider>
      </body>
    </html>
  );
}
