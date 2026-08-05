import { cmsSectionSchema, type CmsSection } from "@khoros/shared";

export interface SeedPageSection {
  type: CmsSection["type"];
  position: number;
  isVisible: boolean;
  config: CmsSection["config"];
}

export interface SeedPage {
  slug: string;
  title: string;
  sections: SeedPageSection[];
}

export interface FaqSeedItem {
  category: string;
  question: string;
  answer: string;
}

export interface CategorySeedItem {
  slug: string;
  name: string;
}

function section(type: CmsSection["type"], config: unknown, position: number): SeedPageSection {
  const parsed = cmsSectionSchema.parse({ type, config });
  return {
    type: parsed.type,
    position,
    isVisible: true,
    config: parsed.config,
  };
}

const DISCLAIMER =
  "Este conteúdo é informativo e educativo, não substitui avaliação, diagnóstico ou acompanhamento profissional.";

const GOLDEN_RULE =
  "Toda funcionalidade nasce de uma hipótese, toda hipótese deve ser validada por dados, e o conteúdo entrega valor real antes de qualquer oferta. Acolher sempre vem antes de converter.";

function homePage(): SeedPage {
  return {
    slug: "home",
    title: "KHOROS — Saúde mental com acolhimento",
    sections: [
      section(
        "hero",
        {
          eyebrow: "Saúde mental com acolhimento",
          title: "Informação de qualidade para cuidar da sua saúde emocional",
          subtitle:
            "A KHOROS está construindo uma forma nova de acessar psicólogos — na hora, por vídeo, pagando só pelos minutos. Enquanto isso, explore conteúdo baseado em evidências para entender, acolher e cuidar de você.",
          ctas: [
            { label: "Explorar o blog", href: "/blog", variant: "primary" },
            { label: "Como a KHOROS vai funcionar", href: "/como-funciona", variant: "secondary" },
          ],
        },
        0,
      ),
      section("category_grid", { title: "Temas em destaque", limit: 6 }, 1),
      section(
        "article_list",
        {
          title: "Artigos recentes",
          limit: 6,
        },
        2,
      ),
      section(
        "cta_band",
        {
          title: "Converse com um especialista na hora",
          text: "Psicólogos com CRP verificado, por vídeo, pagando só os minutos que usar — sem hora marcada. Entre na plataforma ou crie sua conta.",
          buttons: [
            { label: "Entrar", href: "/entrar", variant: "primary" },
            { label: "Criar conta", href: "/cadastro", variant: "secondary" },
          ],
        },
        3,
      ),
      section("disclaimer", { text: GOLDEN_RULE }, 4),
    ],
  };
}

function sobrePage(): SeedPage {
  const markdown = `A KHOROS é uma iniciativa em construção para democratizar o acesso à saúde mental no Brasil. Antes de lançar a plataforma de consultoria instantânea por vídeo, estamos validando a demanda com este blog — porque acreditamos que conteúdo de qualidade é o primeiro passo para gerar confiança.

## Nossa abordagem editorial

Todo conteúdo publicado segue princípios de E-E-A-T (Experiência, Especialização, Autoridade e Confiabilidade), essenciais para temas de saúde:

- Linguagem acolhedora, acessível e sem sensacionalismo
- Base em evidências científicas e fontes confiáveis
- Revisão por profissional de psicologia registrado no CRP
- Avisos claros de que o conteúdo não substitui avaliação profissional
- Recursos de crise sempre visíveis em temas sensíveis

## Quem revisa o conteúdo

**Dra. Ana Paula Mendes**  
Psicóloga clínica — revisão científica  
CRP 06/123456

## Conformidade regulatória

Quando a plataforma KHOROS passar a conectar pacientes a psicólogos, seguiremos integralmente a regulamentação do Conselho Federal de Psicologia (CFP) para atendimento psicológico online, incluindo verificação de registro profissional, sigilo e responsabilidade técnica.

## Onda 0 — Validação por conteúdo

Esta fase do projeto tem um objetivo claro: entender, com dados reais, quantas pessoas buscam informação sobre saúde mental e ainda sentem necessidade de orientação profissional. Isso nos ajuda a construir uma plataforma que realmente atenda à demanda.`;

  return {
    slug: "sobre",
    title: "Sobre — Autoridade e E-E-A-T",
    sections: [
      section(
        "hero",
        {
          title: "Sobre a KHOROS",
          subtitle:
            "Conheça a equipe por trás do blog KHOROS, nossa abordagem editorial e compromisso com conteúdo de saúde mental baseado em evidências.",
          ctas: [],
        },
        0,
      ),
      section("rich_text", { markdown }, 1),
    ],
  };
}

function comoFuncionaPage(): SeedPage {
  return {
    slug: "como-funciona",
    title: "Como a KHOROS vai funcionar",
    sections: [
      section(
        "hero",
        {
          eyebrow: "Em fase de lançamento",
          title: "Como a KHOROS vai funcionar",
          subtitle:
            "A KHOROS nasce para tornar o acesso à saúde mental mais simples, humano e imediato. Ainda estamos construindo a plataforma — mas já queremos ouvir você.",
          ctas: [],
        },
        0,
      ),
      section(
        "steps",
        {
          title: "Passo a passo",
          items: [
            {
              title: "Você precisa de orientação",
              text: "Em um momento de ansiedade, dúvida ou conflito, você acessa a KHOROS pelo celular ou computador.",
            },
            {
              title: "Conectamos na hora",
              text: "Sem burocracia de agenda. Um psicólogo disponível se conecta com você por vídeo em minutos.",
            },
            {
              title: "Pague só pelos minutos",
              text: "Transparência total: você paga apenas pelo tempo de conversa utilizado. Sem mensalidade, sem pacote fechado.",
            },
            {
              title: "Com privacidade e sigilo",
              text: "Ambiente seguro, sigilo profissional e profissionais registrados no CRP, seguindo a regulamentação do CFP.",
            },
          ],
        },
        1,
      ),
      section(
        "rich_text",
        {
          markdown: `## Por que estamos fazendo isso?

Muitas pessoas precisam de orientação profissional, mas enfrentam barreiras: falta de horário, dificuldade de agendar, custo fixo alto ou simplesmente não saber por onde começar. A KHOROS quer reduzir essas barreiras com um modelo flexível e acolhedor.

Este blog é a primeira etapa: validar, com conteúdo de qualidade, quantas pessoas ainda precisam de atendimento mesmo após se informar. Acolher sempre vem antes de converter.

Imagens de referência (legado em \`/images/steps/\`): conectar.jpg, video.jpg, minutos.jpg, privacidade.jpg.`,
        },
        2,
      ),
      section(
        "validation_block",
        {
          title: "Quer ser avisado(a)?",
          text: "Atendimento online, de qualquer lugar. Avisamos por e-mail quando a KHOROS estiver disponível para você falar com um especialista. Sem pressão, sem venda.",
          formId: "waitlist",
          cta: { label: "Quero ser avisado(a)", href: "/como-funciona#lista-espera", variant: "primary" },
        },
        3,
      ),
      section("disclaimer", { text: DISCLAIMER }, 4),
    ],
  };
}

function faqPage(categories: CategorySeedItem[], faqItems: FaqSeedItem[]): SeedPage {
  const sections: SeedPageSection[] = [
    section(
      "hero",
      {
        title: "Perguntas frequentes",
        subtitle: "Respostas profundas e acolhedoras sobre os temas mais buscados em saúde mental.",
        ctas: [],
      },
      0,
    ),
  ];

  let position = 1;
  for (const cat of categories) {
    const items = faqItems
      .filter((item) => item.category === cat.slug)
      .map((item) => ({ question: item.question, answer: item.answer }));
    if (items.length === 0) continue;
    sections.push(section("faq", { title: cat.name, items }, position));
    position += 1;
  }

  return {
    slug: "faq",
    title: "Perguntas frequentes (FAQ)",
    sections,
  };
}

function politicasPrivacidadePage(): SeedPage {
  const markdown = `*Última atualização: julho de 2025*

## 1. Quem somos

A KHOROS é responsável pelo tratamento dos dados pessoais coletados neste site, em conformidade com a Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018).

## 2. Dados que coletamos

- **Lista de aviso:** nome e e-mail (quando você se inscreve voluntariamente)
- **Analytics:** dados anonimizados de navegação (páginas visitadas, origem do tráfego)
- **Eventos de validação:** interações com o bloco "Este conteúdo ajudou você?" (sem identificação pessoal)

## 3. Finalidade

Utilizamos seus dados para:

- Avisá-lo(a) quando a plataforma KHOROS estiver disponível para atendimento online
- Medir interesse e demanda por temas e regiões (validação Onda 0)
- Melhorar a experiência e o conteúdo do blog

## 4. Base legal

O tratamento baseia-se no consentimento (art. 7º, I, LGPD) para a lista de espera, e no legítimo interesse (art. 7º, IX) para analytics anonimizados.

## 5. Compartilhamento

Não vendemos seus dados. Podemos compartilhar com provedores de infraestrutura (hospedagem, banco de dados, analytics) sob contratos de proteção de dados.

## 6. Seus direitos

Você pode solicitar acesso, correção, exclusão ou portabilidade dos seus dados entrando em contato pelo e-mail: privacidade@khoros.com.br

## 7. Retenção

Mantemos os dados da lista de espera enquanto a plataforma não for lançada ou até você solicitar a exclusão.`;

  return {
    slug: "politicas-privacidade",
    title: "Política de Privacidade (LGPD)",
    sections: [
      section("hero", { title: "Política de Privacidade", ctas: [] }, 0),
      section("rich_text", { markdown }, 1),
    ],
  };
}

function politicasTermosPage(): SeedPage {
  const markdown = `*Última atualização: julho de 2025*

## 1. Aceitação

Ao acessar este site, você concorda com estes termos. Se não concordar, por favor não utilize o site.

## 2. Natureza do conteúdo

O blog KHOROS oferece conteúdo informativo e educativo sobre saúde mental. Não constitui consulta, diagnóstico ou tratamento profissional.

## 3. Lista de espera

A inscrição na lista de espera não garante acesso à plataforma nem constitui relação terapêutica. É um registro de interesse para fins de validação e comunicação futura.

## 4. Propriedade intelectual

Todo conteúdo textual, visual e de marca é propriedade da KHOROS, salvo indicação contrária. É permitido compartilhar links para os artigos.

## 5. Limitação de responsabilidade

A KHOROS não se responsabiliza por decisões tomadas com base exclusivamente no conteúdo do blog. Em situações de crise, busque ajuda profissional imediata (CVV 188, SAMU 192).`;

  return {
    slug: "politicas-termos",
    title: "Termos de Uso",
    sections: [
      section("hero", { title: "Termos de Uso", ctas: [] }, 0),
      section("rich_text", { markdown }, 1),
    ],
  };
}

function politicasAvisoPage(): SeedPage {
  const markdown = `## Conteúdo informativo

${DISCLAIMER}

## O que este site não faz

- Não realiza diagnósticos de transtornos mentais
- Não prescreve ou recomenda medicamentos
- Não substitui acompanhamento psicológico ou psiquiátrico
- Não oferece atendimento de emergência

## Recursos de crise

Se você está em crise ou pensando em se machucar:

- **CVV — 188** (24h, gratuito) — cvv.org.br
- **SAMU — 192**
- **CAPS** — rede pública de saúde mental
- **Emergência — 190/192**

## Revisão profissional

Os artigos são produzidos pela equipe editorial e revisados por Dra. Ana Paula Mendes (CRP 06/123456), psicóloga clínica.

## Regulamentação futura

Quando a plataforma KHOROS conectar pacientes a psicólogos, o atendimento seguirá a Resolução CFP nº 11/2018 e demais normas do Conselho Federal de Psicologia para telepsicologia.`;

  return {
    slug: "politicas-aviso",
    title: "Aviso de Conteúdo",
    sections: [
      section("hero", { title: "Aviso de Conteúdo", ctas: [] }, 0),
      section("rich_text", { markdown }, 1),
      section(
        "crisis_banner",
        {
          title: "Precisa de ajuda agora?",
          text: "Se você está em crise ou pensando em se machucar, busque apoio imediato. A KHOROS não substitui atendimento de emergência.",
          showCvv: true,
          showSamu: true,
          showEmergency: true,
          showCaps: true,
        },
        2,
      ),
    ],
  };
}

export function buildMarketingPages(
  categories: CategorySeedItem[],
  faqItems: FaqSeedItem[],
): SeedPage[] {
  return [
    homePage(),
    sobrePage(),
    comoFuncionaPage(),
    faqPage(categories, faqItems),
    politicasPrivacidadePage(),
    politicasTermosPage(),
    politicasAvisoPage(),
  ];
}
