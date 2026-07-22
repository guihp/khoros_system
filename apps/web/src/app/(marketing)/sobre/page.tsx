import type { Metadata } from "next";
import { siteConfig } from "@/lib/blog/site";

export const metadata: Metadata = {
  title: "Sobre — Autoridade e E-E-A-T",
  description:
    "Conheça a equipe por trás do blog KHOROS, nossa abordagem editorial e compromisso com conteúdo de saúde mental baseado em evidências.",
};

export default function SobrePage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      <h1 className="text-3xl sm:text-4xl font-bold font-serif mb-6">Sobre a KHOROS</h1>

      <div className="prose-khoros space-y-6">
        <p>
          A KHOROS é uma iniciativa em construção para democratizar o acesso à saúde mental no
          Brasil. Antes de lançar a plataforma de consultoria instantânea por vídeo, estamos
          validando a demanda com este blog — porque acreditamos que conteúdo de qualidade é o
          primeiro passo para gerar confiança.
        </p>

        <h2>Nossa abordagem editorial</h2>
        <p>
          Todo conteúdo publicado segue princípios de E-E-A-T (Experiência, Especialização,
          Autoridade e Confiabilidade), essenciais para temas de saúde:
        </p>
        <ul>
          <li>Linguagem acolhedora, acessível e sem sensacionalismo</li>
          <li>Base em evidências científicas e fontes confiáveis</li>
          <li>Revisão por profissional de psicologia registrado no CRP</li>
          <li>Avisos claros de que o conteúdo não substitui avaliação profissional</li>
          <li>Recursos de crise sempre visíveis em temas sensíveis</li>
        </ul>

        <h2>Quem revisa o conteúdo</h2>
        <div className="bg-khoros-mint/50 border border-border rounded-2xl p-6 not-prose">
          <p className="font-semibold text-foreground">{siteConfig.reviewer.name}</p>
          <p className="text-khoros-slate text-sm">{siteConfig.reviewer.role}</p>
          <p className="text-khoros-slate text-sm">CRP {siteConfig.reviewer.crp}</p>
        </div>

        <h2>Conformidade regulatória</h2>
        <p>
          Quando a plataforma KHOROS passar a conectar pacientes a psicólogos, seguiremos
          integralmente a regulamentação do Conselho Federal de Psicologia (CFP) para atendimento
          psicológico online, incluindo verificação de registro profissional, sigilo e
          responsabilidade técnica.
        </p>

        <h2>Onda 0 — Validação por conteúdo</h2>
        <p>
          Esta fase do projeto tem um objetivo claro: entender, com dados reais, quantas pessoas
          buscam informação sobre saúde mental e ainda sentem necessidade de orientação
          profissional. Isso nos ajuda a construir uma plataforma que realmente atenda à demanda.
        </p>
      </div>
    </div>
  );
}
