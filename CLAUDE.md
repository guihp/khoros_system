# KHOROS — Marketplace de Psicologia por Vídeo, Pago por Minuto

## O que é

Marketplace de consultas de psicologia por vídeo **sob demanda**: paciente escolhe psicólogo disponível agora, inicia consulta com um clique e paga apenas os minutos usados, debitados de carteira pré-paga (Pix). Sem agendamento obrigatório, sem hora cheia.

- **Escopo desta build:** exclusivamente psicologia / saúde mental. Nenhuma outra vertical.
- **Cliente:** José Alberto. **Executora:** Elonai Automações (Guilherme Henrique).
- **Contexto estratégico (doc "Validação Onda 0"):** KHOROS valida demanda antes com conteúdo/SEO (blog, captura de leads por cidade, recrutamento de psicólogos sob demanda). Esta build é a plataforma transacional que sucede a Onda 0. IA como camada transversal futura (sugestão de conteúdo/especialista, resumos) — nunca substitui o profissional.
- **Regra de negócio central:** tempo medido pelo SERVIDOR (fonte de verdade), crédito debitado em tempo real, repasse ao psicólogo via split automático descontando comissão da plataforma (take rate padrão 20%, configurável por profissional).

## ⚠️ Regra de ouro

**Primeiro o cuidado com a pessoa (triagem de crise, sigilo, consentimento, conformidade CFP), depois a tecnologia.** Um erro no motor de bilhetagem custa dinheiro; um erro na triagem de crise custa uma vida.

## Conformidade obrigatória (CFP + LGPD) — condição de existência

### Psicólogo sempre identificado
- Resolução CFP nº 09/2024 rege atendimento por tecnologias digitais (revogou o cadastro e-Psi, desativado em 31/08/2024). Requisito atual: **inscrição ativa e regular no CRP**.
- Cadastro exige: nome completo, CRP + região, KYC documental, status de inscrição validado pelo **admin** antes de atender.
- CRP exibido publicamente no perfil. Psicólogo nunca é anônimo.
- Psicólogo deve estar em território nacional para atender (registrar país/IP da sessão).
- Paciente pode usar **nickname** público, mas dados reais + consentimento ficam registrados (exigência clínica/prontuário).

### Triagem de crise (BLOQUEANTE — antes de qualquer consulta)
- Atendimento online é **inadequado em urgência/emergência** e **vedado em violência/violação de direitos** (norma CFP) — casos presenciais.
- Triagem curta obrigatória antes de cada consulta. Se indicar risco de vida, ideação suicida, violência ou emergência:
  - **Bloquear** início da consulta.
  - Tela de acolhimento com encaminhamento: **CVV 188** (24h, gratuito, chat em cvv.org.br), **SAMU 192**, **Emergência 190**, **CAPS da região**.
  - Registrar evento (sem dado sensível desnecessário), oferecer conteúdo de apoio.
  - **Nunca** tentar "resolver" a crise na plataforma.
- Banner de apoio permanente e acessível em todo o app.

### Outras regras
- **Menores:** só com consentimento expresso de responsável legal; sem consentimento → bloquear.
- **Termo de consentimento livre e esclarecido** antes da 1ª consulta, com data/hora/versão registrados.
- **Sigilo:** informar quais recursos técnicos garantem sigilo (criptografia, quem acessa dados).
- **Prontuário:** só o psicólogo responsável registra/acessa; criptografado; trilha de auditoria.
- **PROIBIDO gravar sessões.** Não implementar gravação de vídeo/áudio. Sem logs de conteúdo clínico.
- **LGPD:** dados de saúde = sensíveis. Base legal explícita, consentimento granular, criptografia em repouso/trânsito, retenção, exportação e exclusão de dados, registro de consentimentos.
- **PJ:** rodapé com inscrição da pessoa jurídica no CRP + Psicólogo(a) Responsável Técnico(a).
- **Publicidade:** sem promessa de resultado, sem sensacionalismo, sem preço como chamariz agressivo.

## Arquitetura

Monorepo TypeScript (pnpm workspaces + Turborepo).

| Camada | Tecnologia | Papel |
|---|---|---|
| Web | Next.js (App Router) + TS + Tailwind | Paciente + psicólogo + admin |
| Backend | Node.js (Fastify) + TS | API REST + WebSocket |
| Realtime/estado | Redis | Presença, sessões ativas, heartbeats, locks |
| Vídeo | LiveKit | Sala, TURN, SDKs, reconexão — **não reimplementar WebRTC** |
| Banco | PostgreSQL (Supabase) | Persistência + RLS + auditoria |
| Auth | Supabase Auth (e-mail/OTP) | Sessões |
| Pagamento | Pagar.me ou Asaas | Pix (recarga) + split automático |
| Filas | BullMQ (Redis) | Conciliação, repasses, e-mails |
| Observabilidade | Sentry + logs estruturados | Monitoramento |

## Motor de bilhetagem (o coração)

**Servidor é a única fonte de verdade do tempo. Relógio do cliente é irrelevante.**

Fluxo: "Falar agora" → valida (triagem OK, consentimento, saldo ≥ mínimo 5 min, psicólogo AVAILABLE) → cria session PENDING + hold do saldo mínimo + token LiveKit + psicólogo BUSY (lock atômico Redis) → psicólogo aceita → ACTIVE, started_at do servidor → heartbeat assinado (HMAC) via WS a cada 5s dos DOIS lados; servidor só conta tempo com heartbeat de ambos → débito por minuto completo, evento imutável no ledger (débito por evento, nunca recalcular saldo) → avisos de saldo aos 5 e 2 min restantes; zerou → encerra com aviso → ENDED: calcula total, libera hold, dispara split.

Robustez:
- 3 heartbeats perdidos (~15s) → SUSPENDED, relógio pausa, não cobra. Janela de reconexão 60s. Não voltou → ENDED, cobra até último heartbeat válido.
- Idempotência em toda operação financeira (idempotency_key).
- Ledger **append-only**: saldo = soma dos eventos. Nunca update destrutivo.
- Antifraude: HMAC nos heartbeats; ignorar timestamps de cliente; confirmação cruzada via webhooks LiveKit (participant_joined/left).
- Conciliação: job diário ledger × gateway, reporta divergências.

**Testes obrigatórios no motor:** minuto exato, queda de conexão, saldo zerando, sessão simultânea (corrida por psicólogo), fraude de relógio, idempotência de débito.

## Carteira e pagamentos

- Carteira pré-paga via **Pix** (principal): pacotes R$50/R$100/R$200 + valor livre. Cartão só como recarga secundária (sem captura incremental por minuto).
- **Plataforma NÃO faz custódia**: split via instituição regulada (Pagar.me/Asaas) — valor do psicólogo cai direto na conta dele, comissão separada na origem. Evita exigência de IP perante BACEN.
- Onboarding financeiro do psicólogo (recebedor no gateway: KYC, conta, CPF/CNPJ) **antes** de atender.
- Preço por minuto definido pelo psicólogo, com piso/teto da plataforma. Take rate padrão 20%.
- Reembolso: política para falha técnica; disputa no admin.
- **Nada de mock em pagamento/billing: sandbox real do gateway.**

## Modelo de dados (essência)

users, psychologist_profiles, patient_profiles, wallets, ledger_entries (append-only), sessions, session_heartbeats, consents, crisis_screenings, clinical_records (criptografado), reviews, payouts, audit_log. Detalhes em `docs/ARCHITECTURE.md` quando criado.

RLS: paciente só vê os próprios dados; psicólogo só os pacientes que atendeu; prontuário só do autor.

## Segurança

TLS + criptografia em repouso; CPF/prontuário criptografados em coluna; rate limiting; tokens LiveKit gerados no servidor com escopo/expiração curtos; webhooks (gateway + LiveKit) com verificação de assinatura; RLS + menor privilégio; sem gravação; sem logs clínicos.

## Design

Acolhedor, calmo, confiável — saúde mental, não fintech agressiva. Base clara, tons calmos (azuis/verdes suaves + ciano KHOROS como acento), tipografia humana, respiro. WCAG AA. **Mobile-first.** Cronômetro/custo na sala: visível mas discreto, sem gerar ansiedade.

## Plano de entrega

- **Sprint 1 — Fundação + MVP transacional:** monorepo, CI, auth, cadastro + verificação CRP admin, carteira + Pix + ledger, presença + LiveKit + sala 1:1, motor de bilhetagem completo, triagem de crise + consentimentos, split no encerramento, admin mínimo. *Entrega: consulta real paga por minuto, ponta a ponta.*
- **Sprint 2 — Marketplace:** busca/filtros, perfis ricos, avaliações, extrato, disputas/reembolsos, prontuário, relatórios, notificações, agendamento opcional.
- **Sprint 3+:** app React Native (Expo + LiveKit SDK), antifraude avançado, métricas, white-label multi-tenant.

## Como trabalhar

1. Arquitetura + modelo de dados + fluxo de sessão aprovados ANTES de codar (feito/em andamento — ver docs/).
2. Implementar por **vertical slice** (fim a fim), não por camada.
3. Documentar env vars + README de setup.
4. Docs de referência na raiz: `Proposta-KHOROS-Elonai.pdf` (proposta comercial), `validação onda 0 (1).pdf` (estratégia de validação por conteúdo).
