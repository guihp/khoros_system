export const siteConfig = {
  name: "KHOROS",
  tagline: "Saúde mental com acolhimento e acesso na hora",
  description:
    "Blog sobre saúde mental e psicologia. Conteúdo baseado em evidências para educar, acolher e ajudar você a cuidar da sua saúde emocional.",
  url: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  locale: "pt_BR",
  author: {
    name: "Equipe KHOROS",
    role: "Conteúdo em saúde mental",
  },
  reviewer: {
    name: "Dra. Ana Paula Mendes",
    crp: "06/123456",
    role: "Psicóloga clínica — revisão científica",
  },
  crisisResources: {
    cvv: { label: "CVV — 188", phone: "188", url: "https://cvv.org.br" },
    samu: { label: "SAMU — 192", phone: "192" },
    caps: { label: "CAPS — rede pública de saúde mental" },
    emergency: { label: "Emergência — 190/192", phone: "190" },
  },
  disclaimer:
    "Este conteúdo é informativo e educativo, não substitui avaliação, diagnóstico ou acompanhamento profissional.",
  goldenRule:
    "Toda funcionalidade nasce de uma hipótese, toda hipótese deve ser validada por dados, e o conteúdo entrega valor real antes de qualquer oferta. Acolher sempre vem antes de converter.",
} as const;
