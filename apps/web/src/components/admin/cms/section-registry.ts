import {
  cmsSectionSchema,
  CMS_SECTION_TYPES,
  type CmsSection,
  type CmsSectionType,
} from "@khoros/shared";

export const SECTION_TYPE_LABELS: Record<CmsSectionType, string> = {
  hero: "Hero",
  category_grid: "Grade de categorias",
  article_list: "Lista de artigos",
  rich_text: "Texto rico",
  cta_band: "Faixa de CTA",
  faq: "Perguntas frequentes",
  steps: "Passos",
  crisis_banner: "Banner de crise",
  validation_block: "Bloco de validação",
  disclaimer: "Aviso",
};

const DEFAULT_SEEDS: Record<CmsSectionType, unknown> = {
  hero: {
    title: "Novo título",
    ctas: [],
  },
  category_grid: {
    title: "Temas",
    limit: 6,
  },
  article_list: {
    title: "Artigos recentes",
    limit: 6,
  },
  rich_text: {
    markdown: "Escreva o conteúdo em markdown.",
  },
  cta_band: {
    title: "Chamada para ação",
    buttons: [{ label: "Saiba mais", href: "/", variant: "primary" }],
  },
  faq: {
    title: "Perguntas frequentes",
    items: [{ question: "Pergunta", answer: "Resposta" }],
  },
  steps: {
    title: "Como funciona",
    items: [{ title: "Passo 1", text: "Descrição do passo." }],
  },
  crisis_banner: {
    title: "Precisa de ajuda agora?",
    text: "Se você estiver em crise, procure atendimento presencial ou ligue para os canais de emergência.",
    showCvv: true,
    showSamu: true,
    showEmergency: true,
    showCaps: true,
  },
  validation_block: {
    title: "Validação",
    text: "Texto do bloco de validação.",
  },
  disclaimer: {
    title: "Aviso",
    text: "Este conteúdo é informativo e não substitui acompanhamento profissional.",
  },
};

export function defaultSectionConfig(type: CmsSectionType): CmsSection["config"] {
  const parsed = cmsSectionSchema.parse({ type, config: DEFAULT_SEEDS[type] });
  return parsed.config;
}

export function sectionTypeOptions(): { value: CmsSectionType; label: string }[] {
  return CMS_SECTION_TYPES.map((value) => ({
    value,
    label: SECTION_TYPE_LABELS[value],
  }));
}
