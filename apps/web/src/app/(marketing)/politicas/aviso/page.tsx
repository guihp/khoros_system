import type { Metadata } from "next";
import { siteConfig } from "@/lib/blog/site";

export const metadata: Metadata = {
  title: "Aviso de Conteúdo",
  description: "Avisos sobre a natureza informativa do conteúdo de saúde mental da KHOROS.",
};

export default function AvisoPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 prose-khoros">
      <h1 className="text-3xl font-bold font-serif mb-6">Aviso de Conteúdo</h1>

      <h2>Conteúdo informativo</h2>
      <p>{siteConfig.disclaimer}</p>

      <h2>O que este site não faz</h2>
      <ul>
        <li>Não realiza diagnósticos de transtornos mentais</li>
        <li>Não prescreve ou recomenda medicamentos</li>
        <li>Não substitui acompanhamento psicológico ou psiquiátrico</li>
        <li>Não oferece atendimento de emergência</li>
      </ul>

      <h2>Recursos de crise</h2>
      <p>Se você está em crise ou pensando em se machucar:</p>
      <ul>
        <li><strong>CVV — 188</strong> (24h, gratuito) — cvv.org.br</li>
        <li><strong>SAMU — 192</strong></li>
        <li><strong>CAPS</strong> — rede pública de saúde mental</li>
        <li><strong>Emergência — 190/192</strong></li>
      </ul>

      <h2>Revisão profissional</h2>
      <p>
        Os artigos são produzidos pela equipe editorial e revisados por{" "}
        {siteConfig.reviewer.name} (CRP {siteConfig.reviewer.crp}), psicóloga clínica.
      </p>

      <h2>Regulamentação futura</h2>
      <p>
        Quando a plataforma KHOROS conectar pacientes a psicólogos, o atendimento seguirá
        a Resolução CFP nº 11/2018 e demais normas do Conselho Federal de Psicologia
        para telepsicologia.
      </p>
    </div>
  );
}
