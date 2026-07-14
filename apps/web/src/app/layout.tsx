import type { Metadata } from "next";
import { SupportBanner } from "@/components/SupportBanner";
import "./globals.css";

export const metadata: Metadata = {
  title: "KHOROS — Psicologia por vídeo, quando você precisar",
  description:
    "Converse com um psicólogo verificado, por vídeo, pagando apenas os minutos que usar.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="min-h-dvh flex flex-col">
        <SupportBanner />
        <div className="flex-1">{children}</div>
        <footer className="px-4 py-6 text-center text-xs text-calm-600 border-t border-calm-200">
          {/* Inscrição PJ no CRP e Responsável Técnico: valores vêm de platform_settings */}
          <p>KHOROS · Plataforma de psicologia por vídeo</p>
          <p className="mt-1">
            Pessoa jurídica inscrita no CRP · Responsável Técnico(a): a definir — CRP nº a definir
          </p>
          <p className="mt-1">
            Este serviço não substitui atendimento de urgência. Em crise, ligue{" "}
            <strong>CVV 188</strong> ou <strong>SAMU 192</strong>.
          </p>
        </footer>
      </body>
    </html>
  );
}
