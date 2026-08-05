export interface Category {
  slug: string;
  name: string;
  description: string;
  image: string;
  imageAlt: string;
}

/**
 * Lista estática completa (legado MDX). Runtime usa getAllCategories() → CMS API.
 * Mantida para referência e fallbacks de imagem/slug.
 */
export const categoriesLegacy: Category[] = [
  {
    slug: "ansiedade",
    name: "Ansiedade",
    description:
      "Entenda a ansiedade, seus sinais e estratégias para lidar com ela no dia a dia.",
    image: "/images/categories/ansiedade.jpg",
    imageAlt: "Pessoa em postura de calma e respiração consciente",
  },
  {
    slug: "crises-ansiedade-panico",
    name: "Crises de ansiedade e pânico",
    description:
      "Como reconhecer e atravessar crises de ansiedade e ataques de pânico.",
    image: "/images/categories/crises-ansiedade-panico.jpg",
    imageAlt: "Momento de acolhimento e regulação emocional",
  },
  {
    slug: "burnout",
    name: "Burnout",
    description:
      "Exaustão emocional no trabalho: sinais, causas e caminhos de recuperação.",
    image: "/images/categories/burnout.jpg",
    imageAlt: "Profissional em ambiente de trabalho com sinais de exaustão",
  },
  {
    slug: "estresse-trabalho",
    name: "Estresse no trabalho",
    description:
      "Estratégias para lidar com pressão, sobrecarga e estresse profissional.",
    image: "/images/categories/estresse-trabalho.jpg",
    imageAlt: "Pessoa organizando tarefas em ambiente corporativo",
  },
  {
    slug: "terapia-adultos",
    name: "Terapia para adultos",
    description:
      "Como a psicoterapia pode ajudar adultos em diferentes momentos da vida.",
    image: "/images/categories/terapia-adultos.jpg",
    imageAlt: "Adulto em sessão de acolhimento psicológico",
  },
  {
    slug: "terapia-casal",
    name: "Terapia de casal",
    description:
      "Quando buscar terapia de casal e como ela pode fortalecer o relacionamento.",
    image: "/images/categories/terapia-casal.jpg",
    imageAlt: "Casal em conversa acolhedora e conectada",
  },
  {
    slug: "conflitos-familiares",
    name: "Conflitos familiares",
    description:
      "Comunicação, limites e resolução de conflitos dentro da família.",
    image: "/images/categories/conflitos-familiares.jpg",
    imageAlt: "Família em diálogo em ambiente doméstico",
  },
  {
    slug: "sindrome-impostor",
    name: "Síndrome do impostor",
    description: "A sensação de não ser bom o suficiente e como lidar com ela.",
    image: "/images/categories/sindrome-impostor.jpg",
    imageAlt: "Profissional refletindo sobre conquistas e autoconfiança",
  },
  {
    slug: "autoestima",
    name: "Autoestima",
    description: "Construir uma relação mais gentil e realista consigo mesmo.",
    image: "/images/categories/autoestima.jpg",
    imageAlt: "Pessoa com expressão serena e autoconfiante",
  },
  {
    slug: "saude-emocional",
    name: "Saúde emocional",
    description: "Cuidados diários para uma vida emocional mais equilibrada.",
    image: "/images/categories/saude-emocional.jpg",
    imageAlt: "Momento de bem-estar e equilíbrio emocional ao ar livre",
  },
  {
    slug: "terapia-online",
    name: "Terapia online",
    description:
      "Como funciona, eficácia e segurança do atendimento psicológico online.",
    image: "/images/categories/terapia-online.jpg",
    imageAlt: "Atendimento psicológico por vídeo em ambiente reservado",
  },
  {
    slug: "depressao",
    name: "Depressão",
    description:
      "Sinais, compreensão e quando buscar ajuda profissional para a depressão.",
    image: "/images/categories/depressao.jpg",
    imageAlt: "Pessoa em momento de reflexão e acolhimento",
  },
  {
    slug: "dependencia-emocional",
    name: "Dependência emocional",
    description:
      "Reconhecer padrões de dependência emocional e construir autonomia afetiva.",
    image: "/images/categories/dependencia-emocional.jpg",
    imageAlt: "Amigos em conexão saudável e apoio mútuo",
  },
  {
    slug: "luto",
    name: "Luto",
    description:
      "Como atravessar a perda e quando o luto pede acompanhamento profissional.",
    image: "/images/categories/luto.jpg",
    imageAlt: "Paisagem serena representando contemplação e despedida",
  },
];
