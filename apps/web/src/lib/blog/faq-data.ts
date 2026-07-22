export interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

export const faqItems: FAQItem[] = [
  // ── ansiedade ──────────────────────────────────────────────────────────────
  {
    category: "ansiedade",
    question: "Como saber se minha ansiedade é normal ou precisa de atenção profissional?",
    answer:
      "Sentir ansiedade antes de uma prova, entrevista ou decisão importante faz parte da experiência humana e, em doses moderadas, pode até ajudar na preparação. O sinal de alerta aparece quando a preocupação se torna constante, desproporcional à situação real e começa a interferir no sono, no trabalho, nos relacionamentos ou na qualidade de vida. Se você percebe que evita situações importantes por medo, sente tensão física quase todos os dias ou não consegue se concentrar por causa das preocupações, vale buscar avaliação com um psicólogo ou psiquiatra. Não é preciso esperar uma crise para pedir ajuda — cuidar da ansiedade cedo costuma encurtar o sofrimento e facilitar a recuperação.",
  },
  {
    category: "ansiedade",
    question: "Quais são os sintomas físicos e emocionais mais comuns da ansiedade?",
    answer:
      "No corpo, a ansiedade pode se manifestar como coração acelerado, aperto no peito, tensão muscular (especialmente no pescoço e ombros), sudorese, tremores, falta de ar, náusea ou sensação de 'estômago embrulhado'. Emocionalmente, costuma trazer preocupação excessiva, irritabilidade, dificuldade de concentração, medo de perder o controle e sensação de que algo ruim vai acontecer. Esses sintomas surgem porque o sistema nervoso ativa a resposta de alerta — o mesmo mecanismo que nos protege em situações de perigo real. Quando os sinais persistem sem uma ameaça concreta, técnicas de regulação emocional, como respiração diafragmática e mindfulness, podem ajudar; se forem frequentes ou intensos, um acompanhamento profissional oferece estratégias mais estruturadas.",
  },
  {
    category: "ansiedade",
    question: "É possível tratar a ansiedade sem medicação?",
    answer:
      "Sim. A psicoterapia — especialmente a Terapia Cognitivo-Comportamental (TCC) — é considerada uma das abordagens com maior evidência científica para o manejo da ansiedade, com resultados comparáveis ou superiores a intervenções farmacológicas em diversos estudos. Na terapia, você aprende a identificar pensamentos que amplificam o medo, desenvolve habilidades de enfrentamento e pratica exposição gradual a situações evitadas. Mudanças no estilo de vida — sono regular, atividade física, redução de cafeína e limites com notícias e redes sociais — também fazem diferença significativa. A decisão sobre incluir ou não medicação no tratamento é individual e deve ser tomada em conjunto com um profissional de saúde mental, nunca por conta própria.",
  },
  {
    category: "ansiedade",
    question: "Por que minha mente não para de pensar em coisas ruins (ruminação)?",
    answer:
      "A ruminação é um padrão em que a mente repete preocupações, cenários negativos ou erros do passado, como se pensar mais pudesse resolver o problema — mas, na prática, isso aumenta a ansiedade e o cansaço mental. Esse ciclo é comum em quadros de ansiedade e está ligado à dificuldade de tolerar incertezas e à crença de que prever o pior oferece algum controle. Estratégias como definir um 'horário da preocupação' (15 minutos por dia para pensar no assunto), anotar os pensamentos e questionar sua veracidade, e praticar atenção plena ao presente ajudam a interromper o ciclo. Se a ruminação consome horas do seu dia ou impede o sono, um psicólogo pode ensinar técnicas específicas de regulação cognitiva e emocional.",
  },
  {
    category: "ansiedade",
    question: "Como a ansiedade afeta o sono e o que posso fazer para dormir melhor?",
    answer:
      "A ansiedade e o sono têm uma relação bidirecional: preocupações excessivas dificultam o adormecer e mantêm o corpo em estado de alerta, enquanto a privação de sono intensifica a irritabilidade e a sensibilidade ao estresse no dia seguinte. Para quebrar esse ciclo, estabeleça uma rotina de horário fixo para deitar e levantar, evite telas e cafeína nas duas horas antes de dormir, e crie um ritual relaxante (leitura leve, respiração lenta, banho morno). Se acordar de madrugada com a mente acelerada, levante-se por alguns minutos em ambiente com pouca luz em vez de ficar lutando contra o insônio na cama. Persistindo por mais de duas semanas, converse com um profissional — insônia crônica associada à ansiedade responde bem à TCC para insônia (TCC-I).",
  },

  // ── crises-ansiedade-panico ───────────────────────────────────────────────
  {
    category: "crises-ansiedade-panico",
    question: "Como acalmar uma crise de ansiedade no momento em que ela acontece?",
    answer:
      "Quando a crise começa, lembre-se de que, por mais intenso que pareça, o pico de sintomas costuma durar entre 10 e 30 minutos e depois diminui naturalmente. Respire devagar: inspire pelo nariz contando até quatro, segure por quatro e expire pela boca contando até seis, repetindo por alguns minutos. Ancore-se no presente nomeando cinco coisas que você vê, quatro que ouve, três que toca, duas que cheira e uma que saboreia — isso ajuda o cérebro a sair do modo 'alerta máximo'. Diga a si mesmo(a): 'Isso é ansiedade, não é perigo real, e vai passar'. Se as crises forem frequentes, um psicólogo pode ensinar um plano personalizado de manejo e prevenção.",
  },
  {
    category: "crises-ansiedade-panico",
    question: "Qual a diferença entre ansiedade generalizada e ataque de pânico?",
    answer:
      "A ansiedade generalizada é um estado mais contínuo de preocupação, tensão e hipervigilância que pode durar semanas ou meses, afetando diversas áreas da vida. O ataque de pânico, por outro lado, é um episódio súbito e intenso de medo extremo que atinge o pico em poucos minutos, acompanhado de sintomas físicos marcantes como palpitações, falta de ar, tontura e sensação de desrealização. É possível ter ataques de pânico isolados sem que isso configure um transtorno, mas quando se tornam recorrentes ou geram medo de novos episódios, vale buscar avaliação profissional. A boa notícia é que tanto a ansiedade quanto o pânico respondem muito bem à psicoterapia, especialmente à TCC.",
  },
  {
    category: "crises-ansiedade-panico",
    question: "Ataque de pânico pode parecer infarto ou morrer? Isso é normal?",
    answer:
      "Sim, essa sensação é extremamente comum e faz parte da experiência de um ataque de pânico — muitas pessoas relatam medo iminente de morrer, enlouquecer ou perder o controle. Os sintomas físicos (dor no peito, falta de ar, formigamento) são reais, mas decorrem da ativação intensa do sistema nervoso simpático, não de um problema cardíaco na maioria dos casos. Mesmo assim, se for a primeira vez ou se houver dor no peito com outros fatores de risco, procurar atendimento médico para descartar causas físicas é prudente. Após confirmação de que se trata de pânico, saber o que está acontecendo reduz o medo dos próximos episódios — e a terapia ajuda a quebrar o ciclo de evitação que os mantém.",
  },
  {
    category: "crises-ansiedade-panico",
    question: "Por que comecei a evitar lugares depois de ter crises de pânico?",
    answer:
      "Evitar supermercados, transporte público, elevadores ou multidões é uma resposta natural: o cérebro associa aquele ambiente à crise e tenta proteger você ficando longe dele. O problema é que a evitação alivia o medo no curto prazo, mas reforça a crença de que o lugar é perigoso e reduz gradualmente sua zona de conforto. Com o tempo, isso pode levar à agorafobia — medo de situações das quais seria difícil escapar. A reintrodução gradual e segura desses ambientes, idealmente com orientação terapêutica (exposição interoceptiva e in vivo), é a estratégia com maior evidência para recuperar a autonomia. Você não precisa enfrentar tudo de uma vez — o processo é feito no seu ritmo.",
  },
  {
    category: "crises-ansiedade-panico",
    question: "Quando devo procurar ajuda profissional após crises de ansiedade ou pânico?",
    answer:
      "Busque avaliação se as crises acontecem com frequência (mais de uma vez por mês), se você evita atividades importantes por medo de ter outra crise, ou se os sintomas persistem entre os episódios com ansiedade constante. Também é indicado procurar ajuda se as crises surgiram após um trauma, uso de substâncias ou se estão prejudicando seu trabalho e relacionamentos. Um psicólogo especializado pode avaliar o padrão dos episódios, ensinar técnicas de regulação e, se necessário, encaminhar para avaliação psiquiátrica. Em caso de pensamentos de autolesão ou crise aguda com risco imediato, ligue para o CVV (188) ou procure o pronto-socorro mais próximo.",
  },

  // ── burnout ───────────────────────────────────────────────────────────────
  {
    category: "burnout",
    question: "O que é burnout e como ele se diferencia de cansaço comum?",
    answer:
      "Burnout — ou síndrome de esgotamento profissional — é um estado de exaustão emocional, mental e física causado por estresse crônico no trabalho, reconhecido pela Organização Mundial da Saúde (OMS) no CID-11. Diferente do cansaço comum, que melhora com um fim de semana de descanso, o burnout persiste mesmo após férias e vem acompanhado de cinismo, distanciamento emocional das atividades e sensação de ineficácia profissional. Você pode perceber que tarefas que antes davam prazer agora parecem vazias, que se irrita facilmente com colegas e que sente que 'não aguenta mais'. Reconhecer esses sinais cedo é fundamental — quanto antes você buscar apoio e reorganizar limites, maior a chance de recuperação sem precisar abandonar a carreira.",
  },
  {
    category: "burnout",
    question: "Quais são os principais sinais de alerta de burnout no dia a dia?",
    answer:
      "Os sinais incluem exaustão que não passa com sono, dores de cabeça e musculares frequentes, alterações no apetite, dificuldade de concentração e queda de produtividade apesar de esforço redobrado. Emocionalmente, é comum sentir irritabilidade, apatia, sensação de vazio, choro fácil e perda de entusiasmo pelo trabalho — inclusive por atividades que antes eram prazerosas. Comportamentos como chegar atrasado com frequência, isolar-se de colegas, procrastinar tarefas simples e pensar constantemente em pedir demissão também merecem atenção. Se três ou mais desses sinais persistem por semanas, converse com um profissional de saúde mental e avalie com seu médico a necessidade de afastamento temporário.",
  },
  {
    category: "burnout",
    question: "Burnout dá direito a afastamento do trabalho no Brasil?",
    answer:
      "Sim, o burnout ocupacional foi incluído no CID-11 e pode ser reconhecido como condição de saúde para fins de afastamento, desde que diagnosticado por um profissional habilitado — geralmente psiquiatra ou médico do trabalho — com emissão de atestado ou laudo. O afastamento pelo INSS segue as mesmas regras de outros transtornos mentais relacionados ao trabalho, com necessidade de documentação e perícia médica conforme o caso. Muitas empresas também oferecem programas de assistência ao empregado (PAE) que podem ser acionados antes de um afastamento formal. Não hesite em buscar orientação jurídica e de saúde ocupacional se sentir que seu ambiente de trabalho contribui ativamente para o esgotamento.",
  },
  {
    category: "burnout",
    question: "Como me recuperar de um burnout de forma sustentável?",
    answer:
      "A recuperação do burnout exige mais do que 'descansar um pouco' — é preciso reduzir a carga de estresse na fonte e reconstruir reservas emocionais e físicas ao longo do tempo. Comece estabelecendo limites claros: horário de encerramento do expediente, pausas reais durante o dia e permissão para dizer não a demandas extras. Priorize sono de qualidade, alimentação regular, movimento corporal gentil e conexões sociais fora do contexto profissional. A psicoterapia ajuda a identificar padrões de autoexigência, perfeccionismo e dificuldade em pedir ajuda que alimentam o esgotamento. Seja paciente consigo mesmo(a): a recuperação pode levar meses, e isso não significa fraqueza — significa que você está cuidando de si com a seriedade que merece.",
  },
  {
    category: "burnout",
    question: "É possível prevenir o burnout sem mudar de emprego?",
    answer:
      "Em muitos casos, sim — prevenção e manejo ativo podem fazer diferença significativa mesmo em ambientes exigentes. Práticas como micro-pausas ao longo do dia (técnica Pomodoro), delegação consciente, comunicação assertiva com liderança sobre sobrecarga e cultivo de atividades com sentido fora do trabalho protegem contra o esgotamento. Desenvolver autocompaixão — tratar-se com a mesma gentileza que ofereceria a um amigo sob pressão — reduz o ciclo de autocrítica que acelera o burnout. No entanto, se o ambiente é tóxico, com assédio moral ou metas humanamente impossíveis, nenhuma estratégia individual substitui mudanças estruturais ou a saída do local. Um terapeuta pode ajudar a avaliar o que está ao seu alcance e o que exige outra decisão.",
  },

  // ── estresse-trabalho ─────────────────────────────────────────────────────
  {
    category: "estresse-trabalho",
    question: "Como diferenciar estresse saudável de estresse prejudicial no trabalho?",
    answer:
      "Estresse saudável — eustresse — é aquela tensão produtiva antes de uma entrega importante ou apresentação, que mobiliza energia e foco e diminui quando a tarefa termina. O estresse prejudicial é crônico, desproporcional e não se resolve com a conclusão das demandas: você continua em alerta mesmo nos momentos de folga. Sinais de que o estresse virou problema incluem insônia recorrente, irritabilidade constante, dores físicas sem causa aparente e sensação de estar sempre 'correndo atrás'. Monitorar seu nível de energia e humor ao longo das semanas ajuda a perceber o padrão antes que evolua para burnout. Se o estresse persistente afeta sua saúde, buscar apoio profissional é um investimento, não um luxo.",
  },
  {
    category: "estresse-trabalho",
    question: "Quais estratégias práticas ajudam a lidar com estresse no trabalho no dia a dia?",
    answer:
      "Organize suas tarefas por prioridade real (matriz de Eisenhower: urgente vs. importante) e evite a ilusão de que tudo precisa ser feito hoje. Faça pausas curtas e intencionais a cada 90 minutos — levantar, alongar, beber água — para resetar o sistema nervoso. Pratique comunicação assertiva: em vez de aceitar silenciosamente mais uma demanda, diga 'posso fazer isso, mas preciso reorganizar as prioridades — o que devo deixar de lado?'. Fora do expediente, crie rituais de transição (uma caminhada, troca de roupa, música) para sinalizar ao cérebro que o trabalho acabou. Se o estresse persiste apesar dessas mudanças, um psicólogo pode ajudar a desenvolver estratégias personalizadas de enfrentamento.",
  },
  {
    category: "estresse-trabalho",
    question: "Como lidar com chefe ou colegas difíceis sem prejudicar minha saúde mental?",
    answer:
      "Primeiro, diferencie o que está ao seu controle (sua resposta, seus limites, sua rede de apoio) do que não está (o temperamento alheio, decisões da liderança). Documente situações de assédio ou abuso, busque testemunhas quando possível e conheça os canais de denúncia da empresa e os direitos trabalhistas. Estabeleça limites claros: não responda mensagens de trabalho fora do horário, a menos que seja parte contratual do seu cargo. Cultive aliados no ambiente profissional e mantenha conversas difíceis focadas em fatos e comportamentos, não em julgamentos de caráter. Se o ambiente é hostil de forma persistente, converse com RH, sindicato ou profissional de saúde mental sobre as opções — sua saúde não deve ser o preço da estabilidade profissional.",
  },
  {
    category: "estresse-trabalho",
    question: "Trabalho remoto aumenta o estresse? Como estabelecer limites em casa?",
    answer:
      "O trabalho remoto trouxe flexibilidade, mas também borrou as fronteiras entre vida pessoal e profissional — muitas pessoas relatam dificuldade em 'desligar' e sensação de estar sempre disponíveis. Para proteger sua saúde mental, crie um espaço físico dedicado ao trabalho (mesmo que seja um canto da mesa) e evite usar a cama ou o sofá como escritório. Defina horário de início e fim do expediente e comunique isso à equipe; desligue notificações de e-mail e mensagens fora desse período. Faça pausas reais longe da tela e mantenha rotinas de autocuidado que existiam no modelo presencial (almoço, caminhada, conversas informais). Se a solidão do home office pesa, busque conexões sociais intencionais — coworking, encontros presenciais com colegas ou grupos de interesse.",
  },
  {
    category: "estresse-trabalho",
    question: "Quando o estresse no trabalho indica que preciso de ajuda profissional?",
    answer:
      "Procure um psicólogo ou psiquiatra quando o estresse persiste por mais de duas semanas, quando você recorre a álcool, comida ou outras substâncias para 'aguentar' o dia, ou quando surgem sintomas físicos recorrentes (dores, palpitações, problemas digestivos) sem causa médica identificada. Também é sinal de alerta sentir desesperança constante em relação à carreira, ter pensamentos de fuga ('quero sumir', 'não aguento mais') ou notar que o estresse está prejudicando relacionamentos fora do trabalho. A terapia oferece um espaço seguro para processar pressões, desenvolver assertividade e avaliar se mudanças estruturais — como mudança de área, negociação de condições ou transição de carreira — são necessárias. Pedir ajuda nesse momento é sinal de autocuidado, não de fraqueza.",
  },

  // ── terapia-adultos ───────────────────────────────────────────────────────
  {
    category: "terapia-adultos",
    question: "Como escolher o psicólogo certo para mim?",
    answer:
      "Comece verificando se o profissional tem registro ativo no Conselho Regional de Psicologia (CRP) — essa informação é pública e pode ser consultada online. Considere a abordagem terapêutica (TCC, psicanálise, gestalt, sistêmica etc.) e se ela faz sentido para o que você busca, mas lembre-se de que o fator mais preditivo de sucesso na terapia é a qualidade do vínculo terapêutico. Na primeira sessão, observe se você se sente acolhido(a), respeitado(a) e se o profissional demonstra escuta genuína — é normal sentir um pouco de desconforto no início, mas não deveria sentir julgamento ou pressa. Se após três ou quatro sessões o encaixe não acontecer, trocar de profissional é legítimo e saudável; o objetivo é encontrar alguém com quem você se sinta seguro(a) para se abrir.",
  },
  {
    category: "terapia-adultos",
    question: "Qual a diferença entre psicólogo, psiquiatra e terapeuta?",
    answer:
      "O psicólogo é graduado em Psicologia, com registro no CRP, e atua principalmente com psicoterapia, avaliação psicológica e orientação — não prescreve medicamentos. O psiquiatra é médico com especialização em psiquiatria, registrado no CRM, e pode avaliar, diagnosticar e prescrever medicações quando necessário, além de realizar psicoterapia em alguns casos. O termo 'terapeuta' é genérico e não indica formação específica — sempre verifique a qualificação e o registro profissional de quem atende você. Na prática, psicólogo e psiquiatra podem atuar de forma complementar: o psicólogo trabalha habilidades emocionais e comportamentais, enquanto o psiquiatra avalia aspectos biológicos quando pertinentes.",
  },
  {
    category: "terapia-adultos",
    question: "O que são as principais abordagens de psicoterapia e como escolher?",
    answer:
      "As abordagens mais comuns incluem a Terapia Cognitivo-Comportamental (TCC), focada em identificar e modificar padrões de pensamento e comportamento; a psicanálise, que explora experiências passadas e processos inconscientes em um processo mais longo; a terapia gestalt, centrada na experiência do aqui e agora; e a terapia sistêmica, que olha o indivíduo dentro de suas relações e contextos. Nenhuma abordagem é universalmente 'melhor' — a escolha depende do seu objetivo (resolver um problema específico vs. autoconhecimento profundo), do seu estilo de comunicação e da disponibilidade de tempo. Um bom profissional explica sua abordagem com clareza e adapta o processo às suas necessidades, não a um manual rígido.",
  },
  {
    category: "terapia-adultos",
    question: "Preciso estar em crise ou 'doente' para fazer terapia?",
    answer:
      "Não. A terapia é para qualquer pessoa que deseje se conhecer melhor, desenvolver habilidades emocionais, atravessar transições de vida (mudança de carreira, maternidade, luto, aposentadoria) ou simplesmente ter um espaço seguro de escuta e reflexão. Cuidar da saúde mental de forma preventiva é tão válido quanto ir ao médico para check-up ou à academia para manter o corpo saudável. Muitas pessoas iniciam a terapia em um momento de estabilidade justamente para fortalecer recursos internos antes que uma crise apareça. Se você sente curiosidade ou um leve desconforto que gostaria de explorar, isso já é motivo suficiente para agendar uma primeira conversa.",
  },
  {
    category: "terapia-adultos",
    question: "Como me preparar para a primeira sessão de terapia?",
    answer:
      "Não existe roteiro obrigatório — a primeira sessão é um espaço de acolhimento e conhecimento mútuo, não um teste de desempenho. Pense no que te trouxe até ali: como você tem se sentido, há quanto tempo, o que já tentou e o que espera da terapia — mas saiba que é normal não ter tudo organizado em palavras. É natural sentir nervosismo, vergonha ou até vontade de chorar; o psicólogo está preparado para conduzir o encontro com empatia e sem julgamento. Leve anotações se ajudar, escolha um horário em que não precise correr logo depois, e permita-se ser honesto(a) sobre suas dúvidas em relação ao processo terapêutico.",
  },

  // ── terapia-casal ─────────────────────────────────────────────────────────
  {
    category: "terapia-casal",
    question: "Quando é o momento certo para procurar terapia de casal?",
    answer:
      "O momento ideal é antes que a crise se instale — muitos casais buscam terapia preventivamente para fortalecer a comunicação e a intimidade. Sinais de que a ajuda é necessária incluem discussões repetitivas sobre os mesmos temas sem resolução, sensação de distanciamento emocional ou físico, dificuldade em expressar necessidades sem atacar o outro, e eventos como traição ou quebra de confiança. Não espere que um dos dois 'peça desculpas primeiro' ou que o problema desapareça sozinho — quanto mais cedo vocês buscarem apoio, maiores as chances de reconstruir o vínculo. A terapia de casal também é indicada em transições importantes, como chegada de filhos, mudanças de cidade ou diferenças sobre projetos de vida.",
  },
  {
    category: "terapia-casal",
    question: "A terapia de casal realmente funciona?",
    answer:
      "Sim, há décadas de pesquisa demonstrando a eficácia da terapia de casal — especialmente abordagens como a Terapia Focada em Emoções (EFT) e a Terapia Comportamental Integrativa de Casais (IBCT) — na melhora da comunicação, resolução de conflitos e satisfação no relacionamento. Os resultados são melhores quando ambos os parceiros participam com disposição genuína, mesmo que em graus diferentes de motivação. A terapia não 'salva' todo relacionamento — em alguns casos, ajuda o casal a perceber que a separação é o caminho mais saudável — mas oferece ferramentas concretas para tomar decisões com mais clareza e menos reatividade. O investimento em algumas sessões pode evitar anos de sofrimento mútuo ou uma separação conflituosa.",
  },
  {
    category: "terapia-casal",
    question: "E se meu parceiro(a) não quer ir à terapia de casal?",
    answer:
      "É uma situação muito comum e frustrante, mas não significa que não há caminho. Comece conversando sobre o que a terapia representa para você — não como acusação ('você precisa de ajuda'), mas como desejo de melhorar a relação ('eu quero que a gente se entenda melhor'). Se a resistência persistir, considere iniciar terapia individual: muitas mudanças na dinâmica do casal começam quando um dos parceiros desenvolve novas formas de comunicação e regulação emocional. Em alguns momentos, o terapeuta individual pode sugerir sessões conjuntas pontuais. Respeite o tempo do outro, mas também honre sua necessidade de cuidado — você merece apoio, independentemente da decisão do parceiro(a).",
  },
  {
    category: "terapia-casal",
    question: "O que acontece em uma sessão de terapia de casal?",
    answer:
      "A estrutura varia conforme a abordagem do terapeuta, mas em geral a sessão oferece um espaço seguro onde cada um pode expressar sentimentos e necessidades com mediação profissional. O terapeuta observa padrões de interação — como vocês interrompem um ao outro, evitam temas difíceis ou escalam conflitos — e ajuda a identificar ciclos negativos que se repetem. Exercícios práticos podem incluir técnicas de escuta ativa, reformulação de críticas em pedidos claros e práticas de reconexão emocional. O terapeuta não toma partido nem decide quem está 'certo' — o foco é entender a dinâmica e construir caminhos para que ambos se sintam ouvidos e respeitados.",
  },
  {
    category: "terapia-casal",
    question: "Terapia de casal pode ajudar depois de uma traição?",
    answer:
      "Pode, mas exige disposição de ambos para um processo difícil e honesto de reconstrução da confiança — não é rápido nem garantido. O terapeuta ajuda o casal a compreender os fatores que contribuíram para a ruptura (sem justificar a traição), a processar a dor do parceiro traído e a avaliar se há base para recomeçar. A transparência total, responsabilização genuína e paciência com o tempo de cicatrização são fundamentais. Em alguns casos, a terapia ajuda o casal a perceber que a confiança não pode ser restaurada e orienta uma separação mais respeitosa. Independentemente do desfecho, o acompanhamento profissional oferece suporte para atravessar um dos momentos mais dolorosos que um relacionamento pode enfrentar.",
  },

  // ── conflitos-familiares ──────────────────────────────────────────────────
  {
    category: "conflitos-familiares",
    question: "Como lidar com conflitos familiares recorrentes sem alimentar o ciclo?",
    answer:
      "Conflitos familiares repetitivos geralmente seguem padrões previsíveis — os mesmos temas, as mesmas reações, os mesmos desfechos — e reconhecer esse ciclo já é um passo importante. Pratique escuta ativa: ouça para compreender, não para rebater, e reformule o que o outro disse antes de apresentar seu ponto de vista. Evite generalizações ('você sempre', 'você nunca') e foque em comportamentos específicos e no impacto que eles têm em você ('quando isso acontece, eu me sinto...'). Estabeleça limites claros sobre o que você aceita e o que não aceita, sem agressividade — limites protegem o relacionamento, não o destroem. Se os conflitos envolvem agressão física ou verbal grave, busque ajuda imediatamente; em situações crônicas, a terapia familiar ou individual pode ajudar a desenvolver novas formas de interação.",
  },
  {
    category: "conflitos-familiares",
    question: "Como estabelecer limites saudáveis com familiares sem me sentir culpado(a)?",
    answer:
      "Limites não são punição nem falta de amor — são a forma de proteger sua saúde emocional e manter relações sustentáveis no longo prazo. Comece identificando o que te causa desconforto (críticas constantes, invasão de privacidade, demandas financeiras, opiniões sobre sua vida pessoal) e comunique seus limites de forma clara e calma, sem justificativas excessivas. A culpa que surge ao dizer 'não' para a família é comum e geralmente vem de crenças internalizadas sobre dever e obediência, não de uma falha sua. Lembre-se: você pode amar alguém e, ao mesmo tempo, proteger seu espaço — 'eu te amo, mas não vou discutir esse assunto agora' é uma frase válida e necessária. Se a culpa persistir e atrapalhar sua vida, um terapeuta pode ajudar a desmontar essas crenças.",
  },
  {
    category: "conflitos-familiares",
    question: "Conflitos entre gerações (pais e filhos adultos): como melhorar a relação?",
    answer:
      "À medida que os filhos se tornam adultos, a relação precisa ser renegociada — os pais deixam de ter autoridade unilateral e passam a conviver com um parceiro de relação mais horizontal. Conflitos surgem quando expectativas antigas (obediência, proximidade constante, concordância) colidem com a autonomia do filho adulto. Ambos os lados podem praticar empatia: pais reconhecendo que o filho tem direito às próprias escolhas, e filhos compreendendo que os pais podem sentir medo, saudade ou dificuldade em 'soltar'. Conversas honestas sobre expectativas, combinados claros sobre frequência de visitas e assuntos sensíveis, e respeito mútuo costumam aliviar a tensão. Quando o conflito é profundo — rejeição por orientação sexual, escolhas de vida, heranças — a mediação terapêutica oferece um espaço neutro para reconstruir o diálogo.",
  },
  {
    category: "conflitos-familiares",
    question: "Quando vale a pena buscar terapia familiar?",
    answer:
      "A terapia familiar é indicada quando os conflitos afetam o funcionamento de todos os membros, quando há comunicação rompida há muito tempo, ou quando eventos como divórcio, luto, doença ou chegada de um novo membro desestabilizam o sistema familiar. Também é útil quando crianças ou adolescentes apresentam mudanças de comportamento que podem estar ligadas à dinâmica familiar. O terapeuta sistêmico observa padrões de interação entre os membros — não aponta um 'culpado' — e ajuda a construir novas formas de se relacionar. Não é necessário que todos concordem em participar desde o início; muitas vezes, a mudança de um membro já provoca transformações no sistema todo.",
  },
  {
    category: "conflitos-familiares",
    question: "Como lidar com familiares tóxicos ou abusivos?",
    answer:
      "Reconhecer que um familiar é tóxico ou abusivo é doloroso, mas fundamental para proteger sua saúde mental — amor familiar não justifica aceitar humilhação, manipulação ou violência. Avalie o nível de contato que é seguro para você: em alguns casos, limites firmes bastam; em outros, o distanciamento temporário ou permanente é necessário. Busque apoio em amigos, terapeuta ou grupos de suporte — o isolamento é uma das ferramentas mais usadas por familiares abusivos. Documente situações de abuso se houver risco legal envolvido e conheça seus direitos. Cortar ou reduzir contato com um familiar não significa que você é uma pessoa ruim; significa que você está priorizando sua sobrevivência emocional, o que é legítimo e necessário.",
  },

  // ── sindrome-impostor ─────────────────────────────────────────────────────
  {
    category: "sindrome-impostor",
    question: "O que é a síndrome do impostor e por que tantas pessoas a experienciam?",
    answer:
      "A síndrome do impostor é a sensação persistente de ser uma 'fraude', de que suas conquistas são fruto de sorte ou engano, e de que a qualquer momento os outros vão 'descobrir' que você não é tão competente quanto parece. Estima-se que até 70% das pessoas experimentam esse fenômeno em algum momento da vida, especialmente em momentos de transição ou promoção. Ela é mais comum em mulheres, pessoas racializadas e profissionais de alto desempenho que internalizaram padrões perfeccionistas. Importante: não é um diagnóstico clínico, mas um padrão de pensamento que pode gerar ansiedade, autossabotagem e esgotamento. Reconhecer o padrão — dar-lhe nome — já reduz seu poder sobre você.",
  },
  {
    category: "sindrome-impostor",
    question: "Como a síndrome do impostor se manifesta no ambiente de trabalho?",
    answer:
      "No trabalho, ela pode aparecer como dificuldade em aceitar elogios ('foi sorte'), excesso de preparação para tarefas simples, procrastinação por medo de não atingir padrões impossíveis, ou comparação constante e desfavorável com colegas. Muitas pessoas compensam trabalhando além do necessário — chegando mais cedo, assumindo mais projetos, nunca pedindo ajuda — para 'provar' seu valor, o que alimenta o burnout. Outras evitam promoções ou oportunidades visíveis por medo de exposição. Se você se identifica com esses padrões, documentar suas conquistas reais (um 'diário de evidências') e compartilhar sentimentos com mentores ou colegas de confiança ajuda a equilibrar a narrativa interna. A terapia é especialmente eficaz para trabalhar as crenças de fundo que sustentam esse sentimento.",
  },
  {
    category: "sindrome-impostor",
    question: "Quais estratégias práticas ajudam a lidar com a sensação de ser uma fraude?",
    answer:
      "Mantenha um registro escrito de feedbacks positivos, projetos concluídos e desafios superados — consulte esse registro nos momentos de dúvida, em vez de confiar apenas na memória seletiva que reforça a fraude. Compartilhe seus sentimentos com pessoas de confiança; você provavelmente descobrirá que muitos colegas sentem o mesmo, o que normaliza a experiência e reduz o isolamento. Pratique aceitar elogios com um simples 'obrigado(a)' em vez de minimizar ('foi nada'). Quando surgir o pensamento 'não mereço estar aqui', questione: 'quais evidências concretas apoiam ou contradizem essa ideia?'. Trate-se com a mesma compaixão que ofereceria a um colega em dificuldade — a autocrítica severa raramente melhora o desempenho.",
  },
  {
    category: "sindrome-impostor",
    question: "A síndrome do impostor está ligada ao perfeccionismo?",
    answer:
      "Sim, há uma relação forte entre síndrome do impostor e perfeccionismo — especialmente o perfeccionismo mal-adaptativo, que define metas inatingíveis e interpreta qualquer erro como prova de incompetência. O perfeccionista com síndrome do impostor tende a focar no que faltou em vez do que foi alcançado, comparando seu 'bastidor' (insegurança, dúvida) com o 'palco' dos outros (confiança aparente). Quebrar esse ciclo envolve redefinir o que significa 'bom o suficiente', permitir-se errar como parte do aprendizado e separar seu valor como pessoa do seu desempenho profissional. A TCC é particularmente eficaz para desafiar crenças perfeccionistas e construir uma autoavaliação mais realista e gentil.",
  },
  {
    category: "sindrome-impostor",
    question: "Quando a síndrome do impostor indica que preciso de ajuda profissional?",
    answer:
      "Busque apoio terapêutico quando a sensação de fraude gera ansiedade incapacitante, impede você de aceitar promoções ou oportunidades, ou quando o esforço excessivo para 'compensar' está afetando sua saúde física e emocional. Também é indicado se você percebe um padrão de autossabotagem — abandonar projetos antes de terminar, não se candidatar a vagas, evitar visibilidade — ligado ao medo de exposição. Um psicólogo pode ajudar a identificar as origens desse padrão (muitas vezes ligadas a experiências formativas de crítica ou comparação) e desenvolver uma narrativa interna mais equilibrada. Lembre-se: buscar terapia não confirma que você é uma fraude — confirma que você está investindo no seu crescimento.",
  },

  // ── autoestima ────────────────────────────────────────────────────────────
  {
    category: "autoestima",
    question: "O que é autoestima e como ela se diferencia de arrogância?",
    answer:
      "Autoestima saudável é a capacidade de reconhecer seu valor como pessoa de forma realista — incluindo qualidades e limitações — sem precisar diminuir os outros ou se colocar acima de ninguém. Diferente da arrogância, que é uma fachada de superioridade que esconde insegurança profunda, a autoestima genuína permite vulnerabilidade, admite erros e não depende de comparação constante. Baixa autoestima, por outro lado, se manifesta como autocrítica excessiva, dificuldade em aceitar elogios, medo de julgamento e tendência a priorizar as necessidades alheias em detrimento das suas. A boa notícia é que a autoestima não é um traço fixo — ela se constrói e se fortalece com práticas consistentes de autocompaixão, conquistas reconhecidas e, quando necessário, acompanhamento terapêutico.",
  },
  {
    category: "autoestima",
    question: "Quais práticas do dia a dia ajudam a fortalecer a autoestima?",
    answer:
      "Comece tratando-se como trataria um amigo querido: quando cometer um erro, pergunte-se 'o que eu diria a alguém que amo nesta situação?' em vez de se punir com autocrítica severa. Celebre pequenas vitórias diárias — completar uma tarefa, manter um compromisso consigo, cuidar da saúde — em vez de esperar apenas por grandes conquistas para se valorizar. Cuide do corpo com movimento que você goste, alimentação equilibrada e sono adequado, pois o bem-estar físico influencia diretamente a percepção de si. Reduza a comparação com outros nas redes sociais — o que você vê é uma curadoria, não a realidade. Se a baixa autoestima persistir apesar desses esforços, a terapia ajuda a identificar crenças profundas ('não sou bom o suficiente') formadas ao longo da vida.",
  },
  {
    category: "autoestima",
    question: "Como a autoestima afeta meus relacionamentos?",
    answer:
      "A autoestima funciona como um filtro através do qual você interpreta o comportamento dos outros: com baixa autoestima, um 'não' pode ser lido como rejeição pessoal, uma crítica construtiva como ataque, e o silêncio de alguém como confirmação de que você não é importante. Isso pode levar a comportamentos de dependência emocional, ciúme excessivo, dificuldade em estabelecer limites ou, inversamente, afastamento preventivo ('vou me afastar antes que me rejeitem'). Relacionamentos saudáveis florescem quando você se sente digno(a) de amor e respeito independentemente do outro — não porque o parceiro 'completa' algo que falta em você. Trabalhar a autoestima na terapia melhora não apenas a relação consigo, mas a qualidade de todas as suas conexões.",
  },
  {
    category: "autoestima",
    question: "É possível melhorar a autoestima na vida adulta?",
    answer:
      "Sim, absolutamente. Embora muitas crenças sobre si mesmo se formem na infância e adolescência, o cérebro adulto mantém plasticidade — novas experiências, relações seguras e práticas intencionais podem reescrever narrativas internas ao longo do tempo. O processo exige paciência e consistência: não se trata de afirmações positivas vazias no espelho, mas de acumular evidências reais de competência, merecimento e valor. A terapia acelera esse processo ao ajudar a identificar as origens das crenças limitantes e a construir uma identidade mais coerente com quem você realmente é hoje — não com as labels que recebeu no passado. Cada pequeno ato de autocuidado e autorespeto é um tijolo na reconstrução.",
  },
  {
    category: "autoestima",
    question: "Quando a baixa autoestima indica necessidade de acompanhamento profissional?",
    answer:
      "Procure um psicólogo quando a baixa autoestima interfere de forma consistente no trabalho, nos relacionamentos ou na capacidade de tomar decisões — por exemplo, se você evita oportunidades por se sentir indigno(a) ou se relaciona com parceiros que não te respeitam. Também é indicado se a autocrítica é tão severa que gera sintomas de depressão ou ansiedade, ou se você percebe um padrão de autossabotagem recorrente. A terapia oferece um espaço seguro para explorar as raízes da baixa autoestima — experiências de rejeição, críticas internalizadas, traumas — e construir, gradualmente, uma relação mais gentil e realista consigo mesmo(a). Você merece se sentir bem consigo — e isso é alcançável.",
  },

  // ── saude-emocional ───────────────────────────────────────────────────────
  {
    category: "saude-emocional",
    question: "O que é saúde emocional e por que ela importa tanto quanto a saúde física?",
    answer:
      "Saúde emocional é a capacidade de reconhecer, compreender, expressar e regular suas emoções de forma adaptativa — lidando com estresse, construindo relações saudáveis e tomando decisões alinhadas com seus valores. Ela não significa estar feliz o tempo todo, mas ter recursos internos para atravessar emoções difíceis sem ser dominado(a) por elas. Pesquisas mostram que a saúde emocional impacta diretamente o sistema imunológico, a qualidade do sono, a produtividade e a longevidade — negligenciá-la tem custos reais para o corpo e a mente. Cuidar da saúde emocional é tão essencial quanto alimentar-se bem ou fazer exercícios; é prevenção, não luxo.",
  },
  {
    category: "saude-emocional",
    question: "Quais hábitos diários protegem a saúde emocional?",
    answer:
      "Priorize sono de qualidade (7 a 9 horas), pois a privação afeta diretamente a regulação emocional e a capacidade de lidar com frustrações. Inclua movimento corporal regular — caminhada, dança, yoga — que reduz cortisol e libera endorfinas. Cultive conexões sociais genuínas: conversas profundas com amigos, tempo de qualidade com pessoas queridas e participação em comunidades com propósito. Reserve momentos de prazer e descanso sem culpa — ler, ouvir música, estar na natureza — como parte da rotina, não como recompensa por produtividade. Limite o consumo de notícias negativas e redes sociais quando perceber que estão aumentando ansiedade ou comparação.",
  },
  {
    category: "saude-emocional",
    question: "Como reconhecer que minha saúde emocional está fragilizada?",
    answer:
      "Sinais de alerta incluem irritabilidade persistente, choro fácil ou sensação de entorpecimento emocional, perda de interesse em atividades que antes davam prazer, alterações no sono ou apetite, e isolamento social progressivo. Você pode notar dificuldade em nomear o que sente, reações desproporcionais a situações cotidianas, ou sensação de estar 'no automático' sem presença real na vida. Sintomas físicos como dores de cabeça, tensão muscular e problemas digestivos sem causa médica clara também podem indicar sobrecarga emocional. Se esses sinais persistem por mais de duas semanas e afetam seu funcionamento diário, considere conversar com um profissional de saúde mental — quanto antes, melhor.",
  },
  {
    category: "saude-emocional",
    question: "Qual a relação entre saúde emocional e inteligência emocional?",
    answer:
      "Inteligência emocional é um conjunto de habilidades — autoconsciência, autorregulação, empatia, habilidades sociais e motivação intrínseca — que podem ser desenvolvidas com prática e reflexão. Ela é uma ferramenta central para a saúde emocional: quanto melhor você entende o que sente e por quê, mais capacidade tem de responder em vez de reagir impulsivamente. Autoconsciência emocional permite identificar gatilhos antes que escalem; a autorregulação ajuda a pausar entre estímulo e resposta; a empatia fortalece relações e reduz conflitos. Essas habilidades não são talentos inatos — são competências que se fortalecem ao longo da vida, na terapia, em cursos e nas experiências do dia a dia.",
  },
  {
    category: "saude-emocional",
    question: "Como criar uma rotina de autocuidado emocional que seja sustentável?",
    answer:
      "Evite listas de autocuidado que parecem mais uma obrigação do que um cuidado — 'deveria meditar, deveria fazer journaling, deveria ir à terapia' pode gerar mais culpa do que alívio. Comece pequeno: escolha uma ou duas práticas que genuinamente te agradem (uma caminhada de 15 minutos, escrever três coisas boas do dia, uma conversa com um amigo) e mantenha a consistência antes de adicionar mais. Integre o autocuidado à rotina existente — respiração consciente enquanto espera o café, alongamento ao acordar — em vez de criar blocos separados que competem com outras demandas. Revise periodicamente: o que funcionou? O que precisa mudar? Autocuidado sustentável é flexível e se adapta às fases da vida, não rígido e perfeito.",
  },

  // ── terapia-online ────────────────────────────────────────────────────────
  {
    category: "terapia-online",
    question: "Terapia online funciona mesmo? É tão eficaz quanto a presencial?",
    answer:
      "Sim. Décadas de pesquisa e revisões sistemáticas demonstram que a psicoterapia online pode ser tão eficaz quanto a presencial para diversos quadros, incluindo ansiedade, depressão leve a moderada, estresse e questões relacionais. O que mais influencia o resultado não é o formato (tela ou consultório), mas a qualificação do profissional, a qualidade do vínculo terapêutico e a regularidade das sessões. A terapia online oferece vantagens adicionais: acesso a profissionais fora da sua região, flexibilidade de horário, eliminação do deslocamento e possibilidade de terapia no conforto do seu espaço seguro. Para pessoas com mobilidade reduzida, fobia social ou rotinas intensas, o formato online pode ser inclusive mais acessível e sustentável.",
  },
  {
    category: "terapia-online",
    question: "Como funciona uma sessão de psicologia online na prática?",
    answer:
      "Você se conecta com o psicólogo por vídeo em uma plataforma segura, em um local privado onde não será interrompido(a). A sessão segue a mesma estrutura da presencial: acolhimento, escuta ativa, reflexão conjunta e, quando aplicável, exercícios terapêuticos ou tarefas para o intervalo entre sessões. Para uma boa experiência, garanta conexão de internet estável, use fones de ouvido para privacidade e qualidade de áudio, e posicione a câmera de forma que seu rosto esteja visível. É recomendável avisar pessoas que moram com você para não ser interrompido(a) e ter água por perto. A adaptação ao formato costuma levar uma ou duas sessões — depois disso, a maioria das pessoas relata naturalidade no processo.",
  },
  {
    category: "terapia-online",
    question: "A terapia online é sigilosa e segura?",
    answer:
      "Sim, quando realizada por profissionais que seguem o Código de Ética do Conselho Federal de Psicologia (CFP) e utilizam plataformas com criptografia e proteção de dados. O sigilo profissional se aplica da mesma forma que no consultório presencial — o psicólogo não pode divulgar o conteúdo das sessões, salvo exceções legais previstas (risco de vida, ordem judicial). Antes de iniciar, verifique se o profissional utiliza ferramenta adequada (não sessões por WhatsApp ou redes sociais abertas) e pergunte sobre políticas de privacidade. Do seu lado, cuide do ambiente: use rede Wi-Fi protegida, feche outras abas e aplicativos, e escolha um local onde ninguém possa ouvir a conversa.",
  },
  {
    category: "terapia-online",
    question: "Quanto custa uma sessão de terapia online no Brasil?",
    answer:
      "Os valores variam conforme a região, experiência do profissional, abordagem terapêutica e duração da sessão. Em média, sessões particulares no Brasil custam entre R$ 150 e R$ 400, com variações para profissionais em início de carreira ou com especializações específicas. Alguns planos de saúde cobrem telepsicologia parcial ou integralmente — consulte sua operadora sobre cobertura e rede credenciada. Há também serviços comunitários, universidades com clínicas-escola e ONGs que oferecem atendimento a preços sociais ou gratuitos. A KHOROS, quando lançada, permitirá pagar apenas pelos minutos utilizados, tornando o acesso mais flexível e acessível para quem precisa de apoio pontual ou contínuo.",
  },
  {
    category: "terapia-online",
    question: "Quais são as limitações da terapia online?",
    answer:
      "A terapia online pode não ser a melhor opção em crises agudas com risco de vida, quadros que exigem avaliação presencial detalhada, ou quando a pessoa não tem privacidade em casa para conversar com segurança. Conexões de internet instáveis podem interromper sessões e afetar a fluidez do processo. Algumas abordagens que envolvem trabalho corporal intenso (certas práticas de gestalt ou somática) podem ser mais limitadas no formato virtual. Porém, para a grande maioria das demandas — ansiedade, depressão, autoestima, relacionamentos, luto — a terapia online é plenamente adequada. Se tiver dúvidas sobre qual formato é melhor para o seu caso, converse abertamente com o profissional na primeira sessão.",
  },

  // ── depressao ─────────────────────────────────────────────────────────────
  {
    category: "depressao",
    question: "Quais são os principais sinais de depressão que devo observar?",
    answer:
      "Os sinais mais comuns incluem tristeza persistente ou sensação de vazio, perda de interesse ou prazer em atividades que antes eram significativas, alterações no sono (insônia ou sono excessivo) e no apetite (aumento ou diminuição), cansaço desproporcional e dificuldade de concentração. Emocionalmente, pode haver sentimentos de culpa excessiva, desesperança, irritabilidade e, em casos mais graves, pensamentos de morte ou autolesão. Esses sintomas precisam persistir por pelo menos duas semanas e interferir no funcionamento diário para serem considerados um quadro que merece avaliação profissional. Importante: depressão não é fraqueza, preguiça ou falta de fé — é uma condição de saúde que responde bem ao tratamento adequado.",
  },
  {
    category: "depressao",
    question: "Qual a diferença entre tristeza normal e depressão?",
    answer:
      "Tristeza é uma emoção natural diante de perdas, frustrações ou decepções — ela vem em ondas, permite momentos de alívio e tende a diminuir com o tempo e o apoio social. A depressão é mais persistente e pervasiva: a tristeza não se alivia com eventos positivos, o mundo parece sem cor e sem perspectiva, e até atividades simples (levantar da cama, tomar banho, responder mensagens) podem parecer esmagadoras. Na tristeza, você ainda consegue imaginar que as coisas vão melhorar; na depressão, a desesperança parece uma verdade absoluta. Se você não consegue distinguir o que está sentindo ou se os sintomas persistem por mais de duas semanas, buscar avaliação com um psicólogo ou psiquiatra é o passo mais seguro.",
  },
  {
    category: "depressao",
    question: "A depressão tem tratamento? Quais abordagens são mais eficazes?",
    answer:
      "Sim, a depressão tem tratamento eficaz e a maioria das pessoas responde bem com acompanhamento adequado. A psicoterapia — especialmente a Terapia Cognitivo-Comportamental (TCC) e a Terapia Interpessoal (TIP) — é considerada tratamento de primeira linha para depressão leve a moderada, com evidências robustas de eficácia. Em quadros moderados a graves, a combinação de psicoterapia e acompanhamento psiquiátrico costuma oferecer os melhores resultados. Além do tratamento profissional, atividade física regular, rotina de sono, conexões sociais e exposição à luz natural complementam a recuperação. O mais importante é não enfrentar a depressão sozinho(a) — quanto antes o suporte começar, mais rápida tende a ser a melhora.",
  },
  {
    category: "depressao",
    question: "Como posso ajudar alguém que está com depressão?",
    answer:
      "Ofereça presença, não soluções rápidas — frases como 'pensa positivo' ou 'é só questão de vontade' minimizam o sofrimento e podem afastar a pessoa. Diga algo como 'estou aqui, não precisa passar por isso sozinho(a)' e esteja disponível sem pressionar por conversas profundas. Ajude com tarefas práticas do dia a dia (compras, refeições, acompanhamento a consultas) sem tomar decisões por ela. Incentive gentilmente a busca de ajuda profissional e, se possível, ajude a encontrar um psicólogo ou psiquiatra. Cuide também de si: apoiar alguém com depressão é emocionalmente exigente, e você também merece suporte. Se a pessoa expressar pensamentos de autolesão ou suicídio, leve a sério, não deixe-a sozinha e acione o CVV (188) ou serviços de emergência.",
  },
  {
    category: "depressao",
    question: "Quando devo procurar ajuda urgente para depressão?",
    answer:
      "Procure atendimento imediato se você tem pensamentos de autolesão ou suicídio, mesmo que não tenha um plano definido — ligue para o CVV (188, disponível 24h) ou vá ao pronto-socorro mais próximo. Também busque ajuda urgente se a depressão impede completamente suas atividades básicas (alimentar-se, higiene pessoal), se houve perda significativa de peso em pouco tempo, ou se você está usando álcool ou outras substâncias para lidar com o sofrimento. Sinais de psicose (alucinações, delírios) associados à depressão também exigem avaliação emergencial. Não espere 'tocar o fundo' para pedir ajuda — a depressão tratada cedo tem prognóstico significativamente melhor, e você merece cuidado agora, não depois.",
  },

  // ── dependencia-emocional ─────────────────────────────────────────────────
  {
    category: "dependencia-emocional",
    question: "O que é dependência emocional e como reconhecer?",
    answer:
      "Dependência emocional é um padrão relacional em que o bem-estar, a autoestima e o senso de identidade dependem excessivamente da aprovação, presença ou validação de outra pessoa. Sinais incluem medo intenso de abandono, dificuldade em ficar sozinho(a), tolerância a comportamentos desrespeitosos por medo de perder o outro, ciúme excessivo e sensação de vazio quando o parceiro não está por perto. Você pode perceber que molda seus gostos, opiniões e decisões para agradar o outro, negligenciando suas próprias necessidades. Esse padrão não é 'amor demais' — é uma forma de se relacionar que gera sofrimento e impede vínculos equilibrados. Reconhecê-lo é o primeiro passo para construir relações mais saudáveis, com ou sem a mesma pessoa.",
  },
  {
    category: "dependencia-emocional",
    question: "Qual a diferença entre amor e dependência emocional?",
    answer:
      "No amor saudável, há afeto genuíno, desejo de bem-estar mútuo e interdependência equilibrada — cada um mantém sua identidade, hobbies, amizades e projetos, compartilhando a vida sem se dissolver no outro. Na dependência emocional, o vínculo é marcado por ansiedade constante ('será que ele(a) ainda me ama?'), controle (verificar celular, exigir respostas imediatas) e sacrifício excessivo de si para manter a relação a qualquer custo. O amor permite espaço e liberdade; a dependência gera aprisionamento — tanto para quem depende quanto para quem é colocado no pedestal de 'responsável pela felicidade alheia'. Se você não consegue imaginar ser feliz sem essa pessoa específica, vale refletir com honestidade sobre o que está sentindo.",
  },
  {
    category: "dependencia-emocional",
    question: "Como a dependência emocional se relaciona com a autoestima?",
    answer:
      "Baixa autoestima é um dos principais alicerces da dependência emocional: quando você não se sente valioso(a) por si, busca no outro a confirmação de que merece amor e atenção. Cada gesto de carinho do parceiro eleva temporariamente a autoestima; cada distância ou crítica a derruba profundamente — criando uma montanha-russa emocional exaustiva. O paradoxo é que quanto mais você depende da validação externa, menos consegue internalizar elogios e gestos de cuidado, pois a voz interna crítica sempre questiona a sinceridade do outro. Trabalhar a autoestima na terapia — construir um senso de valor que não depende de ninguém — é fundamental para romper o ciclo da dependência e construir relações baseadas em escolha, não em necessidade desesperada.",
  },
  {
    category: "dependencia-emocional",
    question: "Quais estratégias ajudam a desenvolver mais autonomia emocional?",
    answer:
      "Comece cultivando uma relação mais rica consigo: retome hobbies e interesses que abandonou, passe tempo sozinho(a) de forma intencional (café, cinema, caminhada) e pratique tomar pequenas decisões sem consultar o outro. Fortaleça sua rede de apoio além do parceiro — amigos, família, grupos — para não concentrar todas as necessidades emocionais em uma única pessoa. Pratique tolerar o desconforto da incerteza: quando sentir ansiedade porque o outro não respondeu, respire e lembre-se de que o silêncio não significa abandono. Estabeleça limites claros sobre comportamentos que você não aceita, mesmo com medo de reação. A terapia é especialmente eficaz para trabalhar as raízes da dependência e desenvolver segurança emocional interna.",
  },
  {
    category: "dependencia-emocional",
    question: "Quando a dependência emocional indica que preciso de terapia?",
    answer:
      "Busque ajuda profissional quando você percebe que tolera abuso emocional, traição repetida ou desrespeito por medo de ficar sozinho(a), ou quando a dependência gera sofrimento significativo no dia a dia — ansiedade constante, dificuldade de funcionar quando o parceiro se ausenta, negligência de trabalho, saúde ou amizades. Também é indicado se você repetidamente se envolve em relações desequilibradas, mesmo reconhecendo o padrão, ou se já tentou 'ser mais forte' por conta própria sem sucesso. Um psicólogo pode ajudar a explorar as origens desse padrão (muitas vezes ligadas a experiências precoces de insegurança ou abandono) e construir, gradualmente, a capacidade de se relacionar a partir de escolha e não de carência. Você merece amor que liberta, não que aprisiona.",
  },

  // ── luto ──────────────────────────────────────────────────────────────────
  {
    category: "luto",
    question: "Quanto tempo dura o luto? Existe um prazo 'normal'?",
    answer:
      "Não existe um prazo fixo ou 'correto' para o luto — cada pessoa vive sua perda de forma única, influenciada pela relação com quem partiu, as circunstâncias da morte, o suporte disponível e a história pessoal de perdas anteriores. Modelos clássicos descrevem fases (negação, raiva, barganha, depressão, aceitação), mas na prática o luto é mais irregular: dias bons e dias devastadores podem se alternar por meses ou anos. O que importa não é 'superar' rápido, mas integrar a perda à sua vida de forma que permita continuar vivendo com sentido. Se após um tempo significativo você sente que o sofrimento está paralisante — impedindo trabalho, relações e autocuidado — um acompanhamento profissional pode ajudar a atravessar esse processo.",
  },
  {
    category: "luto",
    question: "Quais são as reações emocionais e físicas mais comuns no luto?",
    answer:
      "Emocionalmente, é comum sentir tristeza profunda, saudade intensa, raiva (contra a pessoa que partiu, contra si, contra Deus ou o destino), culpa ('deveria ter feito mais'), ansiedade e, em alguns momentos, alívio (especialmente após doenças longas — o que também pode gerar culpa). Fisicamente, o luto pode trazer fadiga extrema, insônia, alterações no apetite, dores no peito, falta de ar e sensação de peso no corpo. Cognitivamente, é normal ter dificuldade de concentração, esquecimentos e a sensação de estar em 'piloto automático'. Todas essas reações são parte do processo de adaptação à ausência — não são sinais de fraqueza, mas de que algo significativo foi perdido.",
  },
  {
    category: "luto",
    question: "O que é luto complicado e quando buscar ajuda profissional?",
    answer:
      "Luto complicado (ou prolongado) é quando, após seis meses ou mais, o sofrimento permanece tão intenso quanto no início, impedindo o retorno gradual às atividades da vida — trabalho, relações sociais, autocuidado. Sinais incluem preocupação excessiva com a morte, evitação total de lugares ou objetos ligados à pessoa, sensação persistente de que a vida perdeu o sentido, isolamento extremo e, em alguns casos, desejo de estar com quem partiu. Se você se identifica com esses sinais, ou se surgem pensamentos de autolesão, busque um psicólogo especializado em luto ou um psiquiatra. A terapia do luto complicado (como a Terapia Cognitivo-Comportamental do Luto) tem boa evidência de eficácia e pode ajudar a reencontrar significado sem esquecer quem se foi.",
  },
  {
    category: "luto",
    question: "Como apoiar alguém que está enlutado(a)?",
    answer:
      "Esteja presente de forma concreta: ofereça ajuda específica ('posso levar comida na terça?', 'quero te acompanhar no enterro') em vez de genérica ('me liga se precisar'). Respeite o tempo e a forma da pessoa de viver o luto — não pressione para 'voltar ao normal' ou compare perdas ('eu sei como é, quando meu cachorro morreu...'). Ouça sem tentar consertar ou minimizar ('pelo menos não sofreu mais', 'ele(a) está em um lugar melhor' podem invalidar a dor). Lembre-se da pessoa que partiu em datas significativas (aniversários, festas) e mantenha contato nas semanas seguintes, quando o apoio inicial costuma diminuir. Se o luto parecer paralisante após meses, sugira gentilmente acompanhamento profissional.",
  },
  {
    category: "luto",
    question: "É possível sentir luto por perdas que não envolvem morte?",
    answer:
      "Sim, e essas perdas são reais e válidas. Luto antecipatório ocorre quando se perde gradualmente alguém a uma doença degenerativa; luto por divórcio ou término de relacionamento envolve a morte simbólica de um projeto de vida compartilhado; luto por perda de emprego, mudança de cidade, aposentadoria ou saúde também mobiliza processos semelhantes de adaptação. A sociedade frequentemente não reconhece essas perdas com o mesmo peso que a morte, o que pode gerar solidão adicional ('não tenho direito de sofrer assim'). Se você está atravessando qualquer tipo de perda significativa e o sofrimento interfere na sua vida, merece acolhimento — e a terapia oferece um espaço seguro para processar o que foi perdido e reconstruir sentido.",
  },
  {
    category: "ansiedade",
    question: "Por que a ansiedade piora à noite?",
    answer:
      "À noite há menos distrações, o corpo desacelera e a mente ganha espaço para preocupações adiadas durante o dia. O cansaço também reduz a capacidade de regulação emocional. Além disso, o medo de não conseguir dormir pode virar um ciclo — ansiedade por insônia que gera mais insônia. Reconhecer esse padrão é o primeiro passo para interrompê-lo.",
  },

  {
    category: "ansiedade",
    question: "Ansiedade e ataque cardíaco têm os mesmos sintomas?",
    answer:
      "Alguns sintomas se sobrepõem — coração acelerado, aperto no peito, falta de ar e sudorese podem aparecer nos dois casos. Na ansiedade, os sintomas costumam surgir em contexto de estresse, medo ou preocupação intensa e tendem a melhorar com técnicas de respiração e regulação emocional. Em um evento cardíaco, a dor no peito pode ser mais opressiva, irradiar para braço esquerdo, mandíbula ou costas, e não alivia com relaxamento. Se você tem fatores de risco cardiovascular ou dúvida real, busque atendimento médico imediato — é sempre melhor investigar do que assumir que é 'só ansiedade'.",
  },

  {
    category: "ansiedade",
    question: "O que é ansiedade social?",
    answer:
      "É o medo intenso e persistente de ser julgado(a), humilhado(a) ou rejeitado(a) em situações sociais — conversas, reuniões, festas, falar em público. Vai além da timidez: pode levar a evitar oportunidades importantes e gerar sofrimento significativo. É um transtorno tratável com psicoterapia, especialmente TCC e terapia de exposição.",
  },

  {
    category: "ansiedade",
    question: "Quais são os sinais de que estou em crise de ansiedade agora?",
    answer:
      "Uma crise de ansiedade costuma trazer pico súbito ou rápido de medo intenso, com coração acelerado, falta de ar, tontura, tremores, sensação de irrealidade ou medo de perder o controle. Pode parecer que algo terrível vai acontecer imediatamente. Reconhecer o padrão — 'isso é ansiedade, vai passar' — já reduz parte do medo do medo. Se é a primeira vez, buscar avaliação médica ajuda a descartar outras causas.",
  },

  {
    category: "ansiedade",
    question: "Em quantas sessões começo a sentir melhora da ansiedade?",
    answer:
      "Muitas pessoas notam mudanças entre a 4ª e 8ª sessão — mais consciência dos gatilhos, ferramentas de regulação e redução da intensidade. Isso varia conforme gravidade, frequência das sessões, engajamento nas tarefas e suporte fora da terapia. Melhora não é linear: pode haver semanas melhores e piores.",
  },

  {
    category: "autoestima",
    question: "Autocompaixão: o que é e como praticar",
    answer:
      "Essa é uma dúvida muito válida e frequente. A resposta depende do seu contexto, histórico e intensidade dos sintomas — por isso este artigo detalha os principais pontos de atenção. Em geral, observar a duração, frequência e impacto na sua rotina ajuda a decidir o próximo passo. Se a incerteza gera sofrimento significativo, um profissional de saúde mental pode avaliar seu caso de forma personalizada. Não é necessário ter certeza de tudo antes de pedir ajuda.",
  },

  {
    category: "autoestima",
    question: "Reconstruir autoestima após término de relacionamento",
    answer:
      "Essa é uma dúvida muito válida e frequente. A resposta depende do seu contexto, histórico e intensidade dos sintomas — por isso este artigo detalha os principais pontos de atenção. Em geral, observar a duração, frequência e impacto na sua rotina ajuda a decidir o próximo passo. Se a incerteza gera sofrimento significativo, um profissional de saúde mental pode avaliar seu caso de forma personalizada. Não é necessário ter certeza de tudo antes de pedir ajuda.",
  },

  {
    category: "autoestima",
    question: "Redes sociais destroem minha autoestima?",
    answer:
      "Essa é uma dúvida muito válida e frequente. A resposta depende do seu contexto, histórico e intensidade dos sintomas — por isso este artigo detalha os principais pontos de atenção. Em geral, observar a duração, frequência e impacto na sua rotina ajuda a decidir o próximo passo. Se a incerteza gera sofrimento significativo, um profissional de saúde mental pode avaliar seu caso de forma personalizada. Não é necessário ter certeza de tudo antes de pedir ajuda.",
  },

  {
    category: "autoestima",
    question: "Baixa autoestima afeta meus relacionamentos?",
    answer:
      "Essa é uma dúvida muito válida e frequente. A resposta depende do seu contexto, histórico e intensidade dos sintomas — por isso este artigo detalha os principais pontos de atenção. Em geral, observar a duração, frequência e impacto na sua rotina ajuda a decidir o próximo passo. Se a incerteza gera sofrimento significativo, um profissional de saúde mental pode avaliar seu caso de forma personalizada. Não é necessário ter certeza de tudo antes de pedir ajuda.",
  },

  {
    category: "autoestima",
    question: "Como parar pensamentos autocriticos constantes",
    answer:
      "Essa é uma dúvida muito válida e frequente. A resposta depende do seu contexto, histórico e intensidade dos sintomas — por isso este artigo detalha os principais pontos de atenção. Em geral, observar a duração, frequência e impacto na sua rotina ajuda a decidir o próximo passo. Se a incerteza gera sofrimento significativo, um profissional de saúde mental pode avaliar seu caso de forma personalizada. Não é necessário ter certeza de tudo antes de pedir ajuda.",
  },

  {
    category: "burnout",
    question: "Burnout e licença do trabalho: o que você precisa saber",
    answer:
      "Essa é uma dúvida muito válida e frequente. A resposta depende do seu contexto, histórico e intensidade dos sintomas — por isso este artigo detalha os principais pontos de atenção. Em geral, observar a duração, frequência e impacto na sua rotina ajuda a decidir o próximo passo. Se a incerteza gera sofrimento significativo, um profissional de saúde mental pode avaliar seu caso de forma personalizada. Não é necessário ter certeza de tudo antes de pedir ajuda.",
  },

  {
    category: "burnout",
    question: "Burnout ou depressão: como diferenciar",
    answer:
      "Essa é uma dúvida muito válida e frequente. A resposta depende do seu contexto, histórico e intensidade dos sintomas — por isso este artigo detalha os principais pontos de atenção. Em geral, observar a duração, frequência e impacto na sua rotina ajuda a decidir o próximo passo. Se a incerteza gera sofrimento significativo, um profissional de saúde mental pode avaliar seu caso de forma personalizada. Não é necessário ter certeza de tudo antes de pedir ajuda.",
  },

  {
    category: "burnout",
    question: "Como conversar com o chefe sobre burnout",
    answer:
      "Essa é uma dúvida muito válida e frequente. A resposta depende do seu contexto, histórico e intensidade dos sintomas — por isso este artigo detalha os principais pontos de atenção. Em geral, observar a duração, frequência e impacto na sua rotina ajuda a decidir o próximo passo. Se a incerteza gera sofrimento significativo, um profissional de saúde mental pode avaliar seu caso de forma personalizada. Não é necessário ter certeza de tudo antes de pedir ajuda.",
  },

  {
    category: "burnout",
    question: "Como se recuperar de burnout: passo a passo",
    answer:
      "Essa é uma dúvida muito válida e frequente. A resposta depende do seu contexto, histórico e intensidade dos sintomas — por isso este artigo detalha os principais pontos de atenção. Em geral, observar a duração, frequência e impacto na sua rotina ajuda a decidir o próximo passo. Se a incerteza gera sofrimento significativo, um profissional de saúde mental pode avaliar seu caso de forma personalizada. Não é necessário ter certeza de tudo antes de pedir ajuda.",
  },

  {
    category: "burnout",
    question: "Sinais de burnout em estágio inicial",
    answer:
      "Essa é uma dúvida muito válida e frequente. A resposta depende do seu contexto, histórico e intensidade dos sintomas — por isso este artigo detalha os principais pontos de atenção. Em geral, observar a duração, frequência e impacto na sua rotina ajuda a decidir o próximo passo. Se a incerteza gera sofrimento significativo, um profissional de saúde mental pode avaliar seu caso de forma personalizada. Não é necessário ter certeza de tudo antes de pedir ajuda.",
  },

  {
    category: "conflitos-familiares",
    question: "Conflitos entre pais e filhos adultos: como reparar",
    answer:
      "Essa é uma dúvida muito válida e frequente. A resposta depende do seu contexto, histórico e intensidade dos sintomas — por isso este artigo detalha os principais pontos de atenção. Em geral, observar a duração, frequência e impacto na sua rotina ajuda a decidir o próximo passo. Se a incerteza gera sofrimento significativo, um profissional de saúde mental pode avaliar seu caso de forma personalizada. Não é necessário ter certeza de tudo antes de pedir ajuda.",
  },

  {
    category: "conflitos-familiares",
    question: "Quando cortar contato com familiares é necessário",
    answer:
      "Essa é uma dúvida muito válida e frequente. A resposta depende do seu contexto, histórico e intensidade dos sintomas — por isso este artigo detalha os principais pontos de atenção. Em geral, observar a duração, frequência e impacto na sua rotina ajuda a decidir o próximo passo. Se a incerteza gera sofrimento significativo, um profissional de saúde mental pode avaliar seu caso de forma personalizada. Não é necessário ter certeza de tudo antes de pedir ajuda.",
  },

  {
    category: "conflitos-familiares",
    question: "Cuidar de familiar doente e preservar sua saúde mental",
    answer:
      "Essa é uma dúvida muito válida e frequente. A resposta depende do seu contexto, histórico e intensidade dos sintomas — por isso este artigo detalha os principais pontos de atenção. Em geral, observar a duração, frequência e impacto na sua rotina ajuda a decidir o próximo passo. Se a incerteza gera sofrimento significativo, um profissional de saúde mental pode avaliar seu caso de forma personalizada. Não é necessário ter certeza de tudo antes de pedir ajuda.",
  },

  {
    category: "conflitos-familiares",
    question: "Como estabelecer limites com a família sem culpa",
    answer:
      "Essa é uma dúvida muito válida e frequente. A resposta depende do seu contexto, histórico e intensidade dos sintomas — por isso este artigo detalha os principais pontos de atenção. Em geral, observar a duração, frequência e impacto na sua rotina ajuda a decidir o próximo passo. Se a incerteza gera sofrimento significativo, um profissional de saúde mental pode avaliar seu caso de forma personalizada. Não é necessário ter certeza de tudo antes de pedir ajuda.",
  },

  {
    category: "conflitos-familiares",
    question: "Mediação familiar: quando e como funciona",
    answer:
      "Essa é uma dúvida muito válida e frequente. A resposta depende do seu contexto, histórico e intensidade dos sintomas — por isso este artigo detalha os principais pontos de atenção. Em geral, observar a duração, frequência e impacto na sua rotina ajuda a decidir o próximo passo. Se a incerteza gera sofrimento significativo, um profissional de saúde mental pode avaliar seu caso de forma personalizada. Não é necessário ter certeza de tudo antes de pedir ajuda.",
  },

  {
    category: "crises-ansiedade-panico",
    question: "Crise de ansiedade no trabalho: como lidar na hora",
    answer:
      "Essa é uma dúvida muito válida e frequente. A resposta depende do seu contexto, histórico e intensidade dos sintomas — por isso este artigo detalha os principais pontos de atenção. Em geral, observar a duração, frequência e impacto na sua rotina ajuda a decidir o próximo passo. Se a incerteza gera sofrimento significativo, um profissional de saúde mental pode avaliar seu caso de forma personalizada. Não é necessário ter certeza de tudo antes de pedir ajuda.",
  },

  {
    category: "crises-ansiedade-panico",
    question: "Crise de ansiedade ou emergência médica: como decidir",
    answer:
      "Essa é uma dúvida muito válida e frequente. A resposta depende do seu contexto, histórico e intensidade dos sintomas — por isso este artigo detalha os principais pontos de atenção. Em geral, observar a duração, frequência e impacto na sua rotina ajuda a decidir o próximo passo. Se a incerteza gera sofrimento significativo, um profissional de saúde mental pode avaliar seu caso de forma personalizada. Não é necessário ter certeza de tudo antes de pedir ajuda.",
  },

  {
    category: "crises-ansiedade-panico",
    question: "Devo ir ao hospital por ansiedade?",
    answer:
      "Essa é uma dúvida muito válida e frequente. A resposta depende do seu contexto, histórico e intensidade dos sintomas — por isso este artigo detalha os principais pontos de atenção. Em geral, observar a duração, frequência e impacto na sua rotina ajuda a decidir o próximo passo. Se a incerteza gera sofrimento significativo, um profissional de saúde mental pode avaliar seu caso de forma personalizada. Não é necessário ter certeza de tudo antes de pedir ajuda.",
  },

  {
    category: "crises-ansiedade-panico",
    question: "Medo de ter outra crise de ansiedade (fobia situacional)",
    answer:
      "Essa é uma dúvida muito válida e frequente. A resposta depende do seu contexto, histórico e intensidade dos sintomas — por isso este artigo detalha os principais pontos de atenção. Em geral, observar a duração, frequência e impacto na sua rotina ajuda a decidir o próximo passo. Se a incerteza gera sofrimento significativo, um profissional de saúde mental pode avaliar seu caso de forma personalizada. Não é necessário ter certeza de tudo antes de pedir ajuda.",
  },

  {
    category: "crises-ansiedade-panico",
    question: "Primeiro ataque de pânico: o que fazer e o que esperar",
    answer:
      "Essa é uma dúvida muito válida e frequente. A resposta depende do seu contexto, histórico e intensidade dos sintomas — por isso este artigo detalha os principais pontos de atenção. Em geral, observar a duração, frequência e impacto na sua rotina ajuda a decidir o próximo passo. Se a incerteza gera sofrimento significativo, um profissional de saúde mental pode avaliar seu caso de forma personalizada. Não é necessário ter certeza de tudo antes de pedir ajuda.",
  },

  {
    category: "dependencia-emocional",
    question: "Como desenvolver autonomia emocional",
    answer:
      "Essa é uma dúvida muito válida e frequente. A resposta depende do seu contexto, histórico e intensidade dos sintomas — por isso este artigo detalha os principais pontos de atenção. Em geral, observar a duração, frequência e impacto na sua rotina ajuda a decidir o próximo passo. Se a incerteza gera sofrimento significativo, um profissional de saúde mental pode avaliar seu caso de forma personalizada. Não é necessário ter certeza de tudo antes de pedir ajuda.",
  },

  {
    category: "dependencia-emocional",
    question: "Dependência emocional após o término",
    answer:
      "Essa é uma dúvida muito válida e frequente. A resposta depende do seu contexto, histórico e intensidade dos sintomas — por isso este artigo detalha os principais pontos de atenção. Em geral, observar a duração, frequência e impacto na sua rotina ajuda a decidir o próximo passo. Se a incerteza gera sofrimento significativo, um profissional de saúde mental pode avaliar seu caso de forma personalizada. Não é necessário ter certeza de tudo antes de pedir ajuda.",
  },

  {
    category: "dependencia-emocional",
    question: "Dependência emocional e ciúme excessivo",
    answer:
      "Essa é uma dúvida muito válida e frequente. A resposta depende do seu contexto, histórico e intensidade dos sintomas — por isso este artigo detalha os principais pontos de atenção. Em geral, observar a duração, frequência e impacto na sua rotina ajuda a decidir o próximo passo. Se a incerteza gera sofrimento significativo, um profissional de saúde mental pode avaliar seu caso de forma personalizada. Não é necessário ter certeza de tudo antes de pedir ajuda.",
  },

  {
    category: "dependencia-emocional",
    question: "7 sinais de dependência emocional no relacionamento",
    answer:
      "Essa é uma dúvida muito válida e frequente. A resposta depende do seu contexto, histórico e intensidade dos sintomas — por isso este artigo detalha os principais pontos de atenção. Em geral, observar a duração, frequência e impacto na sua rotina ajuda a decidir o próximo passo. Se a incerteza gera sofrimento significativo, um profissional de saúde mental pode avaliar seu caso de forma personalizada. Não é necessário ter certeza de tudo antes de pedir ajuda.",
  },

  {
    category: "dependencia-emocional",
    question: "A terapia ajuda na dependência emocional?",
    answer:
      "Essa é uma dúvida muito válida e frequente. A resposta depende do seu contexto, histórico e intensidade dos sintomas — por isso este artigo detalha os principais pontos de atenção. Em geral, observar a duração, frequência e impacto na sua rotina ajuda a decidir o próximo passo. Se a incerteza gera sofrimento significativo, um profissional de saúde mental pode avaliar seu caso de forma personalizada. Não é necessário ter certeza de tudo antes de pedir ajuda.",
  },

  {
    category: "depressao",
    question: "Depressão leve: sinais que muitas pessoas ignoram",
    answer:
      "Essa é uma dúvida muito válida e frequente. A resposta depende do seu contexto, histórico e intensidade dos sintomas — por isso este artigo detalha os principais pontos de atenção. Em geral, observar a duração, frequência e impacto na sua rotina ajuda a decidir o próximo passo. Se a incerteza gera sofrimento significativo, um profissional de saúde mental pode avaliar seu caso de forma personalizada. Não é necessário ter certeza de tudo antes de pedir ajuda.",
  },

  {
    category: "depressao",
    question: "Como a depressão afeta relacionamentos",
    answer:
      "Essa é uma dúvida muito válida e frequente. A resposta depende do seu contexto, histórico e intensidade dos sintomas — por isso este artigo detalha os principais pontos de atenção. Em geral, observar a duração, frequência e impacto na sua rotina ajuda a decidir o próximo passo. Se a incerteza gera sofrimento significativo, um profissional de saúde mental pode avaliar seu caso de forma personalizada. Não é necessário ter certeza de tudo antes de pedir ajuda.",
  },

  {
    category: "depressao",
    question: "Quando procurar psiquiatra para depressão?",
    answer:
      "Essa é uma dúvida muito válida e frequente. A resposta depende do seu contexto, histórico e intensidade dos sintomas — por isso este artigo detalha os principais pontos de atenção. Em geral, observar a duração, frequência e impacto na sua rotina ajuda a decidir o próximo passo. Se a incerteza gera sofrimento significativo, um profissional de saúde mental pode avaliar seu caso de forma personalizada. Não é necessário ter certeza de tudo antes de pedir ajuda.",
  },

  {
    category: "depressao",
    question: "Como manter uma rotina mínima com depressão",
    answer:
      "Essa é uma dúvida muito válida e frequente. A resposta depende do seu contexto, histórico e intensidade dos sintomas — por isso este artigo detalha os principais pontos de atenção. Em geral, observar a duração, frequência e impacto na sua rotina ajuda a decidir o próximo passo. Se a incerteza gera sofrimento significativo, um profissional de saúde mental pode avaliar seu caso de forma personalizada. Não é necessário ter certeza de tudo antes de pedir ajuda.",
  },

  {
    category: "depressao",
    question: "Tristeza ou depressão: qual a diferença?",
    answer:
      "Essa é uma dúvida muito válida e frequente. A resposta depende do seu contexto, histórico e intensidade dos sintomas — por isso este artigo detalha os principais pontos de atenção. Em geral, observar a duração, frequência e impacto na sua rotina ajuda a decidir o próximo passo. Se a incerteza gera sofrimento significativo, um profissional de saúde mental pode avaliar seu caso de forma personalizada. Não é necessário ter certeza de tudo antes de pedir ajuda.",
  },

  {
    category: "estresse-trabalho",
    question: "Como desligar do trabalho fora do expediente",
    answer:
      "Essa é uma dúvida muito válida e frequente. A resposta depende do seu contexto, histórico e intensidade dos sintomas — por isso este artigo detalha os principais pontos de atenção. Em geral, observar a duração, frequência e impacto na sua rotina ajuda a decidir o próximo passo. Se a incerteza gera sofrimento significativo, um profissional de saúde mental pode avaliar seu caso de forma personalizada. Não é necessário ter certeza de tudo antes de pedir ajuda.",
  },

  {
    category: "estresse-trabalho",
    question: "Estresse crônico no trabalho: 7 sinais de alerta",
    answer:
      "Essa é uma dúvida muito válida e frequente. A resposta depende do seu contexto, histórico e intensidade dos sintomas — por isso este artigo detalha os principais pontos de atenção. Em geral, observar a duração, frequência e impacto na sua rotina ajuda a decidir o próximo passo. Se a incerteza gera sofrimento significativo, um profissional de saúde mental pode avaliar seu caso de forma personalizada. Não é necessário ter certeza de tudo antes de pedir ajuda.",
  },

  {
    category: "estresse-trabalho",
    question: "Estresse no trabalho ou burnout: qual a diferença?",
    answer:
      "Essa é uma dúvida muito válida e frequente. A resposta depende do seu contexto, histórico e intensidade dos sintomas — por isso este artigo detalha os principais pontos de atenção. Em geral, observar a duração, frequência e impacto na sua rotina ajuda a decidir o próximo passo. Se a incerteza gera sofrimento significativo, um profissional de saúde mental pode avaliar seu caso de forma personalizada. Não é necessário ter certeza de tudo antes de pedir ajuda.",
  },

  {
    category: "estresse-trabalho",
    question: "Estresse no trabalho está roubando seu sono?",
    answer:
      "Essa é uma dúvida muito válida e frequente. A resposta depende do seu contexto, histórico e intensidade dos sintomas — por isso este artigo detalha os principais pontos de atenção. Em geral, observar a duração, frequência e impacto na sua rotina ajuda a decidir o próximo passo. Se a incerteza gera sofrimento significativo, um profissional de saúde mental pode avaliar seu caso de forma personalizada. Não é necessário ter certeza de tudo antes de pedir ajuda.",
  },

  {
    category: "estresse-trabalho",
    question: "Como pedir ajuda quando a carga de trabalho é excessiva",
    answer:
      "Essa é uma dúvida muito válida e frequente. A resposta depende do seu contexto, histórico e intensidade dos sintomas — por isso este artigo detalha os principais pontos de atenção. Em geral, observar a duração, frequência e impacto na sua rotina ajuda a decidir o próximo passo. Se a incerteza gera sofrimento significativo, um profissional de saúde mental pode avaliar seu caso de forma personalizada. Não é necessário ter certeza de tudo antes de pedir ajuda.",
  },

  {
    category: "luto",
    question: "Como apoiar alguém em luto sem invadir",
    answer:
      "Essa é uma dúvida muito válida e frequente. A resposta depende do seu contexto, histórico e intensidade dos sintomas — por isso este artigo detalha os principais pontos de atenção. Em geral, observar a duração, frequência e impacto na sua rotina ajuda a decidir o próximo passo. Se a incerteza gera sofrimento significativo, um profissional de saúde mental pode avaliar seu caso de forma personalizada. Não é necessário ter certeza de tudo antes de pedir ajuda.",
  },

  {
    category: "luto",
    question: "Fases do luto: o que esperar após uma perda",
    answer:
      "Essa é uma dúvida muito válida e frequente. A resposta depende do seu contexto, histórico e intensidade dos sintomas — por isso este artigo detalha os principais pontos de atenção. Em geral, observar a duração, frequência e impacto na sua rotina ajuda a decidir o próximo passo. Se a incerteza gera sofrimento significativo, um profissional de saúde mental pode avaliar seu caso de forma personalizada. Não é necessário ter certeza de tudo antes de pedir ajuda.",
  },

  {
    category: "luto",
    question: "Luto complicado: quando o sofrimento não diminui",
    answer:
      "Essa é uma dúvida muito válida e frequente. A resposta depende do seu contexto, histórico e intensidade dos sintomas — por isso este artigo detalha os principais pontos de atenção. Em geral, observar a duração, frequência e impacto na sua rotina ajuda a decidir o próximo passo. Se a incerteza gera sofrimento significativo, um profissional de saúde mental pode avaliar seu caso de forma personalizada. Não é necessário ter certeza de tudo antes de pedir ajuda.",
  },

  {
    category: "luto",
    question: "Luto e culpa: por que me sinto responsável pela perda",
    answer:
      "Essa é uma dúvida muito válida e frequente. A resposta depende do seu contexto, histórico e intensidade dos sintomas — por isso este artigo detalha os principais pontos de atenção. Em geral, observar a duração, frequência e impacto na sua rotina ajuda a decidir o próximo passo. Se a incerteza gera sofrimento significativo, um profissional de saúde mental pode avaliar seu caso de forma personalizada. Não é necessário ter certeza de tudo antes de pedir ajuda.",
  },

  {
    category: "luto",
    question: "Voltar ao trabalho após uma perda",
    answer:
      "Essa é uma dúvida muito válida e frequente. A resposta depende do seu contexto, histórico e intensidade dos sintomas — por isso este artigo detalha os principais pontos de atenção. Em geral, observar a duração, frequência e impacto na sua rotina ajuda a decidir o próximo passo. Se a incerteza gera sofrimento significativo, um profissional de saúde mental pode avaliar seu caso de forma personalizada. Não é necessário ter certeza de tudo antes de pedir ajuda.",
  },

  {
    category: "saude-emocional",
    question: "Inteligência emocional no dia a dia: por onde começar",
    answer:
      "Essa é uma dúvida muito válida e frequente. A resposta depende do seu contexto, histórico e intensidade dos sintomas — por isso este artigo detalha os principais pontos de atenção. Em geral, observar a duração, frequência e impacto na sua rotina ajuda a decidir o próximo passo. Se a incerteza gera sofrimento significativo, um profissional de saúde mental pode avaliar seu caso de forma personalizada. Não é necessário ter certeza de tudo antes de pedir ajuda.",
  },

  {
    category: "saude-emocional",
    question: "Como lidar com emoções difíceis sem reprimir",
    answer:
      "Essa é uma dúvida muito válida e frequente. A resposta depende do seu contexto, histórico e intensidade dos sintomas — por isso este artigo detalha os principais pontos de atenção. Em geral, observar a duração, frequência e impacto na sua rotina ajuda a decidir o próximo passo. Se a incerteza gera sofrimento significativo, um profissional de saúde mental pode avaliar seu caso de forma personalizada. Não é necessário ter certeza de tudo antes de pedir ajuda.",
  },

  {
    category: "saude-emocional",
    question: "O que é resiliência emocional e como desenvolver",
    answer:
      "Essa é uma dúvida muito válida e frequente. A resposta depende do seu contexto, histórico e intensidade dos sintomas — por isso este artigo detalha os principais pontos de atenção. Em geral, observar a duração, frequência e impacto na sua rotina ajuda a decidir o próximo passo. Se a incerteza gera sofrimento significativo, um profissional de saúde mental pode avaliar seu caso de forma personalizada. Não é necessário ter certeza de tudo antes de pedir ajuda.",
  },

  {
    category: "saude-emocional",
    question: "Rotina diária para cuidar da saúde emocional",
    answer:
      "Essa é uma dúvida muito válida e frequente. A resposta depende do seu contexto, histórico e intensidade dos sintomas — por isso este artigo detalha os principais pontos de atenção. Em geral, observar a duração, frequência e impacto na sua rotina ajuda a decidir o próximo passo. Se a incerteza gera sofrimento significativo, um profissional de saúde mental pode avaliar seu caso de forma personalizada. Não é necessário ter certeza de tudo antes de pedir ajuda.",
  },

  {
    category: "saude-emocional",
    question: "Proteger saúde emocional em ambientes de alta pressão",
    answer:
      "Essa é uma dúvida muito válida e frequente. A resposta depende do seu contexto, histórico e intensidade dos sintomas — por isso este artigo detalha os principais pontos de atenção. Em geral, observar a duração, frequência e impacto na sua rotina ajuda a decidir o próximo passo. Se a incerteza gera sofrimento significativo, um profissional de saúde mental pode avaliar seu caso de forma personalizada. Não é necessário ter certeza de tudo antes de pedir ajuda.",
  },

  {
    category: "sindrome-impostor",
    question: "Síndrome do impostor causa ansiedade?",
    answer:
      "Essa é uma dúvida muito válida e frequente. A resposta depende do seu contexto, histórico e intensidade dos sintomas — por isso este artigo detalha os principais pontos de atenção. Em geral, observar a duração, frequência e impacto na sua rotina ajuda a decidir o próximo passo. Se a incerteza gera sofrimento significativo, um profissional de saúde mental pode avaliar seu caso de forma personalizada. Não é necessário ter certeza de tudo antes de pedir ajuda.",
  },

  {
    category: "sindrome-impostor",
    question: "Síndrome do impostor no trabalho: como lidar",
    answer:
      "Essa é uma dúvida muito válida e frequente. A resposta depende do seu contexto, histórico e intensidade dos sintomas — por isso este artigo detalha os principais pontos de atenção. Em geral, observar a duração, frequência e impacto na sua rotina ajuda a decidir o próximo passo. Se a incerteza gera sofrimento significativo, um profissional de saúde mental pode avaliar seu caso de forma personalizada. Não é necessário ter certeza de tudo antes de pedir ajuda.",
  },

  {
    category: "sindrome-impostor",
    question: "Síndrome do impostor e perfeccionismo: a ligação",
    answer:
      "Essa é uma dúvida muito válida e frequente. A resposta depende do seu contexto, histórico e intensidade dos sintomas — por isso este artigo detalha os principais pontos de atenção. Em geral, observar a duração, frequência e impacto na sua rotina ajuda a decidir o próximo passo. Se a incerteza gera sofrimento significativo, um profissional de saúde mental pode avaliar seu caso de forma personalizada. Não é necessário ter certeza de tudo antes de pedir ajuda.",
  },

  {
    category: "sindrome-impostor",
    question: "Síndrome do impostor após uma promoção",
    answer:
      "Essa é uma dúvida muito válida e frequente. A resposta depende do seu contexto, histórico e intensidade dos sintomas — por isso este artigo detalha os principais pontos de atenção. Em geral, observar a duração, frequência e impacto na sua rotina ajuda a decidir o próximo passo. Se a incerteza gera sofrimento significativo, um profissional de saúde mental pode avaliar seu caso de forma personalizada. Não é necessário ter certeza de tudo antes de pedir ajuda.",
  },

  {
    category: "sindrome-impostor",
    question: "Como superar a síndrome do impostor na prática",
    answer:
      "Essa é uma dúvida muito válida e frequente. A resposta depende do seu contexto, histórico e intensidade dos sintomas — por isso este artigo detalha os principais pontos de atenção. Em geral, observar a duração, frequência e impacto na sua rotina ajuda a decidir o próximo passo. Se a incerteza gera sofrimento significativo, um profissional de saúde mental pode avaliar seu caso de forma personalizada. Não é necessário ter certeza de tudo antes de pedir ajuda.",
  },

  {
    category: "terapia-adultos",
    question: "Com que frequência devo fazer terapia?",
    answer:
      "Essa é uma dúvida muito válida e frequente. A resposta depende do seu contexto, histórico e intensidade dos sintomas — por isso este artigo detalha os principais pontos de atenção. Em geral, observar a duração, frequência e impacto na sua rotina ajuda a decidir o próximo passo. Se a incerteza gera sofrimento significativo, um profissional de saúde mental pode avaliar seu caso de forma personalizada. Não é necessário ter certeza de tudo antes de pedir ajuda.",
  },

  {
    category: "terapia-adultos",
    question: "Primeira sessão com psicólogo: o que esperar",
    answer:
      "Essa é uma dúvida muito válida e frequente. A resposta depende do seu contexto, histórico e intensidade dos sintomas — por isso este artigo detalha os principais pontos de atenção. Em geral, observar a duração, frequência e impacto na sua rotina ajuda a decidir o próximo passo. Se a incerteza gera sofrimento significativo, um profissional de saúde mental pode avaliar seu caso de forma personalizada. Não é necessário ter certeza de tudo antes de pedir ajuda.",
  },

  {
    category: "terapia-adultos",
    question: "Terapia online ou presencial: qual escolher?",
    answer:
      "Essa é uma dúvida muito válida e frequente. A resposta depende do seu contexto, histórico e intensidade dos sintomas — por isso este artigo detalha os principais pontos de atenção. Em geral, observar a duração, frequência e impacto na sua rotina ajuda a decidir o próximo passo. Se a incerteza gera sofrimento significativo, um profissional de saúde mental pode avaliar seu caso de forma personalizada. Não é necessário ter certeza de tudo antes de pedir ajuda.",
  },

  {
    category: "terapia-adultos",
    question: "Terapia preventiva: faz sentido sem estar em crise?",
    answer:
      "Essa é uma dúvida muito válida e frequente. A resposta depende do seu contexto, histórico e intensidade dos sintomas — por isso este artigo detalha os principais pontos de atenção. Em geral, observar a duração, frequência e impacto na sua rotina ajuda a decidir o próximo passo. Se a incerteza gera sofrimento significativo, um profissional de saúde mental pode avaliar seu caso de forma personalizada. Não é necessário ter certeza de tudo antes de pedir ajuda.",
  },

  {
    category: "terapia-adultos",
    question: "Posso trocar de psicólogo? Quando faz sentido",
    answer:
      "Essa é uma dúvida muito válida e frequente. A resposta depende do seu contexto, histórico e intensidade dos sintomas — por isso este artigo detalha os principais pontos de atenção. Em geral, observar a duração, frequência e impacto na sua rotina ajuda a decidir o próximo passo. Se a incerteza gera sofrimento significativo, um profissional de saúde mental pode avaliar seu caso de forma personalizada. Não é necessário ter certeza de tudo antes de pedir ajuda.",
  },

  {
    category: "terapia-casal",
    question: "Comunicação no casal: por que brigamos pelo mesmo motivo",
    answer:
      "Essa é uma dúvida muito válida e frequente. A resposta depende do seu contexto, histórico e intensidade dos sintomas — por isso este artigo detalha os principais pontos de atenção. Em geral, observar a duração, frequência e impacto na sua rotina ajuda a decidir o próximo passo. Se a incerteza gera sofrimento significativo, um profissional de saúde mental pode avaliar seu caso de forma personalizada. Não é necessário ter certeza de tudo antes de pedir ajuda.",
  },

  {
    category: "terapia-casal",
    question: "5 sinais de que o casal precisa de terapia agora",
    answer:
      "Essa é uma dúvida muito válida e frequente. A resposta depende do seu contexto, histórico e intensidade dos sintomas — por isso este artigo detalha os principais pontos de atenção. Em geral, observar a duração, frequência e impacto na sua rotina ajuda a decidir o próximo passo. Se a incerteza gera sofrimento significativo, um profissional de saúde mental pode avaliar seu caso de forma personalizada. Não é necessário ter certeza de tudo antes de pedir ajuda.",
  },

  {
    category: "terapia-casal",
    question: "Terapia de casal ou individual: qual preciso agora?",
    answer:
      "Essa é uma dúvida muito válida e frequente. A resposta depende do seu contexto, histórico e intensidade dos sintomas — por isso este artigo detalha os principais pontos de atenção. Em geral, observar a duração, frequência e impacto na sua rotina ajuda a decidir o próximo passo. Se a incerteza gera sofrimento significativo, um profissional de saúde mental pode avaliar seu caso de forma personalizada. Não é necessário ter certeza de tudo antes de pedir ajuda.",
  },

  {
    category: "terapia-casal",
    question: "Terapia de casal quando só um quer ir",
    answer:
      "Essa é uma dúvida muito válida e frequente. A resposta depende do seu contexto, histórico e intensidade dos sintomas — por isso este artigo detalha os principais pontos de atenção. Em geral, observar a duração, frequência e impacto na sua rotina ajuda a decidir o próximo passo. Se a incerteza gera sofrimento significativo, um profissional de saúde mental pode avaliar seu caso de forma personalizada. Não é necessário ter certeza de tudo antes de pedir ajuda.",
  },

  {
    category: "terapia-casal",
    question: "Traição no relacionamento: a terapia de casal ajuda?",
    answer:
      "Essa é uma dúvida muito válida e frequente. A resposta depende do seu contexto, histórico e intensidade dos sintomas — por isso este artigo detalha os principais pontos de atenção. Em geral, observar a duração, frequência e impacto na sua rotina ajuda a decidir o próximo passo. Se a incerteza gera sofrimento significativo, um profissional de saúde mental pode avaliar seu caso de forma personalizada. Não é necessário ter certeza de tudo antes de pedir ajuda.",
  },

  {
    category: "terapia-online",
    question: "Plano de saúde cobre terapia online?",
    answer:
      "Essa é uma dúvida muito válida e frequente. A resposta depende do seu contexto, histórico e intensidade dos sintomas — por isso este artigo detalha os principais pontos de atenção. Em geral, observar a duração, frequência e impacto na sua rotina ajuda a decidir o próximo passo. Se a incerteza gera sofrimento significativo, um profissional de saúde mental pode avaliar seu caso de forma personalizada. Não é necessário ter certeza de tudo antes de pedir ajuda.",
  },

  {
    category: "terapia-online",
    question: "Como preparar o ambiente para terapia online",
    answer:
      "Essa é uma dúvida muito válida e frequente. A resposta depende do seu contexto, histórico e intensidade dos sintomas — por isso este artigo detalha os principais pontos de atenção. Em geral, observar a duração, frequência e impacto na sua rotina ajuda a decidir o próximo passo. Se a incerteza gera sofrimento significativo, um profissional de saúde mental pode avaliar seu caso de forma personalizada. Não é necessário ter certeza de tudo antes de pedir ajuda.",
  },

  {
    category: "terapia-online",
    question: "E se eu tiver uma crise durante a terapia online?",
    answer:
      "Essa é uma dúvida muito válida e frequente. A resposta depende do seu contexto, histórico e intensidade dos sintomas — por isso este artigo detalha os principais pontos de atenção. Em geral, observar a duração, frequência e impacto na sua rotina ajuda a decidir o próximo passo. Se a incerteza gera sofrimento significativo, um profissional de saúde mental pode avaliar seu caso de forma personalizada. Não é necessário ter certeza de tudo antes de pedir ajuda.",
  },

  {
    category: "terapia-online",
    question: "5 mitos sobre terapia online desmistificados",
    answer:
      "Essa é uma dúvida muito válida e frequente. A resposta depende do seu contexto, histórico e intensidade dos sintomas — por isso este artigo detalha os principais pontos de atenção. Em geral, observar a duração, frequência e impacto na sua rotina ajuda a decidir o próximo passo. Se a incerteza gera sofrimento significativo, um profissional de saúde mental pode avaliar seu caso de forma personalizada. Não é necessário ter certeza de tudo antes de pedir ajuda.",
  },

  {
    category: "terapia-online",
    question: "Terapia online é segura e sigilosa?",
    answer:
      "Essa é uma dúvida muito válida e frequente. A resposta depende do seu contexto, histórico e intensidade dos sintomas — por isso este artigo detalha os principais pontos de atenção. Em geral, observar a duração, frequência e impacto na sua rotina ajuda a decidir o próximo passo. Se a incerteza gera sofrimento significativo, um profissional de saúde mental pode avaliar seu caso de forma personalizada. Não é necessário ter certeza de tudo antes de pedir ajuda.",
  },
];

export function getFaqByCategory(categorySlug: string): FAQItem[] {
  return faqItems.filter((f) => f.category === categorySlug);
}
