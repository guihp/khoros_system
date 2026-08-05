/**
 * Categorias estáticas usadas pelo seed MDX → cms_*.
 * Espelha o conteúdo legado de apps/web (pré-CMS). Runtime do blog lê a API.
 */
export interface SeedCategorySource {
  slug: string;
  name: string;
  description: string;
  image: string;
}

export const seedCategories: SeedCategorySource[] = [
  {
    slug: "ansiedade",
    name: "Ansiedade",
    description:
      "Entenda a ansiedade, seus sinais e estratégias para lidar com ela no dia a dia.",
    image: "/images/categories/ansiedade.jpg",
  },
  {
    slug: "crises-ansiedade-panico",
    name: "Crises de ansiedade e pânico",
    description:
      "Como reconhecer e atravessar crises de ansiedade e ataques de pânico.",
    image: "/images/categories/crises-ansiedade-panico.jpg",
  },
  {
    slug: "burnout",
    name: "Burnout",
    description:
      "Exaustão emocional no trabalho: sinais, causas e caminhos de recuperação.",
    image: "/images/categories/burnout.jpg",
  },
  {
    slug: "estresse-trabalho",
    name: "Estresse no trabalho",
    description:
      "Estratégias para lidar com pressão, sobrecarga e estresse profissional.",
    image: "/images/categories/estresse-trabalho.jpg",
  },
  {
    slug: "terapia-adultos",
    name: "Terapia para adultos",
    description:
      "Como a psicoterapia pode ajudar adultos em diferentes momentos da vida.",
    image: "/images/categories/terapia-adultos.jpg",
  },
  {
    slug: "terapia-casal",
    name: "Terapia de casal",
    description:
      "Quando buscar terapia de casal e como ela pode fortalecer o relacionamento.",
    image: "/images/categories/terapia-casal.jpg",
  },
  {
    slug: "conflitos-familiares",
    name: "Conflitos familiares",
    description:
      "Comunicação, limites e resolução de conflitos dentro da família.",
    image: "/images/categories/conflitos-familiares.jpg",
  },
  {
    slug: "sindrome-impostor",
    name: "Síndrome do impostor",
    description: "A sensação de não ser bom o suficiente e como lidar com ela.",
    image: "/images/categories/sindrome-impostor.jpg",
  },
  {
    slug: "autoestima",
    name: "Autoestima",
    description: "Construir uma relação mais gentil e realista consigo mesmo.",
    image: "/images/categories/autoestima.jpg",
  },
  {
    slug: "saude-emocional",
    name: "Saúde emocional",
    description: "Cuidados diários para uma vida emocional mais equilibrada.",
    image: "/images/categories/saude-emocional.jpg",
  },
  {
    slug: "terapia-online",
    name: "Terapia online",
    description:
      "Como funciona, eficácia e segurança do atendimento psicológico online.",
    image: "/images/categories/terapia-online.jpg",
  },
  {
    slug: "depressao",
    name: "Depressão",
    description:
      "Sinais, compreensão e quando buscar ajuda profissional para a depressão.",
    image: "/images/categories/depressao.jpg",
  },
  {
    slug: "dependencia-emocional",
    name: "Dependência emocional",
    description:
      "Reconhecer padrões de dependência emocional e construir autonomia afetiva.",
    image: "/images/categories/dependencia-emocional.jpg",
  },
  {
    slug: "luto",
    name: "Luto",
    description:
      "Como atravessar a perda e quando o luto pede acompanhamento profissional.",
    image: "/images/categories/luto.jpg",
  },
];
