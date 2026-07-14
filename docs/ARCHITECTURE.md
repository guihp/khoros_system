# KHOROS — Arquitetura, Modelo de Dados e Fluxo de Sessão

> **Status: APROVADO em 14/07/2026** — Fastify · Asaas · LiveKit Cloud · cobrança por minuto completo · repasse por sessão (D+0).
> Versão 1.0 · 14/07/2026

---

## 1. Visão geral da arquitetura

```
┌─────────────────────────────────────────────────────────────────┐
│                        apps/web (Next.js)                        │
│   /            paciente (home, busca, carteira, sala)           │
│   /pro         psicólogo (painel, sala + prontuário, extrato)   │
│   /admin       admin (verificação CRP, sessões, conciliação)    │
└──────────────┬───────────────────────────────┬──────────────────┘
               │ HTTPS (REST)                  │ WSS (heartbeat, presença,
               │                               │      eventos de sessão)
┌──────────────▼───────────────────────────────▼──────────────────┐
│                     apps/api (Fastify + TS)                      │
│  módulos: auth · profiles · wallet · billing-engine · sessions   │
│           presence · screening · consents · admin · webhooks     │
└───┬──────────────┬──────────────┬──────────────┬────────────────┘
    │              │              │              │
┌───▼────┐   ┌─────▼─────┐  ┌─────▼─────┐  ┌─────▼──────┐
│ Redis  │   │ Postgres  │  │  LiveKit  │  │  Gateway   │
│presença│   │ (Supabase)│  │  (vídeo)  │  │ Pix + split│
│locks   │   │ RLS+audit │  │  webhooks │  │  webhooks  │
│hb, BullMQ│ │           │  │           │  │            │
└────────┘   └───────────┘  └───────────┘  └────────────┘
```

Monorepo **pnpm workspaces + Turborepo**:

```
khoros/
├── apps/
│   ├── web/          # Next.js App Router (paciente + psicólogo + admin)
│   └── api/          # Fastify: REST + WebSocket + workers BullMQ
├── packages/
│   ├── db/           # schema SQL, migrations, tipos gerados, políticas RLS
│   ├── shared/       # tipos TS, schemas zod, constantes (compartilhados web/api)
│   └── config/       # eslint, tsconfig, tailwind preset (design tokens)
├── docs/
└── CLAUDE.md
```

Decisões de stack (padrão da proposta; alternativas na §8):

| Camada | Escolha | Racional |
|---|---|---|
| Backend | **Fastify** | Leve, WS de primeira classe, sem cerimônia — motor de bilhetagem é código de domínio puro, não precisa do peso do Nest |
| Vídeo | **LiveKit Cloud** no MVP | Zero ops de SFU/TURN; migração p/ self-host depois é só trocar URL/keys |
| Gateway | **Asaas** (ver §6 — nuance importante do split) | Subcontas white-label com transferência interna instantânea — encaixa melhor no modelo de carteira pré-paga |
| Auth | Supabase Auth (e-mail/OTP) | JWT verificado no Fastify via JWKS |
| Filas | BullMQ sobre o mesmo Redis | Ticker de billing, conciliação diária, e-mails, repasses |

---

## 2. Modelo de dados (PostgreSQL / Supabase)

Convenções: `id uuid default gen_random_uuid()`, timestamps `timestamptz`, dinheiro sempre em **centavos (bigint)**, enums nativas do Postgres.

### 2.1 Identidade e perfis

```sql
-- espelha auth.users do Supabase; criada via trigger no signup
users (
  id uuid PK,                        -- = auth.users.id
  role user_role NOT NULL,           -- PATIENT | PSYCHOLOGIST | ADMIN
  email text UNIQUE NOT NULL,
  full_name text NOT NULL,
  public_nickname text,              -- exibição pública do paciente (opcional)
  cpf_encrypted bytea,               -- pgsodium / cifra de coluna
  status user_status NOT NULL DEFAULT 'ACTIVE',  -- ACTIVE|SUSPENDED|DELETED
  created_at timestamptz
)

psychologist_profiles (
  user_id uuid PK FK->users,
  crp_numero text NOT NULL,
  crp_regiao text NOT NULL,          -- ex.: "06" (SP)
  crp_status crp_status NOT NULL DEFAULT 'PENDING',  -- PENDING|VERIFIED|REJECTED|REVOKED
  verificado_em timestamptz,
  verificado_por uuid FK->users,     -- admin
  bio text,
  abordagens text[],                 -- TCC, psicanálise, sistêmica...
  especialidades text[],             -- ansiedade, burnout, casal...
  foto_url text,
  preco_por_minuto_centavos int NOT NULL,   -- validado contra piso/teto (platform_settings)
  take_rate numeric(4,3) NOT NULL DEFAULT 0.200,
  recebedor_gateway_id text,         -- id da subconta no Asaas; NULL = onboarding pendente
  disponibilidade availability NOT NULL DEFAULT 'OFFLINE'  -- AVAILABLE|BUSY|OFFLINE (cache; verdade operacional no Redis)
)

patient_profiles (
  user_id uuid PK FK->users,
  cidade text,
  data_nascimento date NOT NULL,     -- para regra de menor de idade
  responsavel_legal_id uuid FK->users NULL
)
```

**Regra de atendimento**: psicólogo só recebe chamadas se `crp_status='VERIFIED'` **e** `recebedor_gateway_id IS NOT NULL`.

### 2.2 Carteira e ledger (append-only)

```sql
wallets (
  user_id uuid PK FK->users,
  saldo_centavos bigint NOT NULL DEFAULT 0,           -- cache materializado
  saldo_reservado_centavos bigint NOT NULL DEFAULT 0, -- holds ativos
  updated_at timestamptz
)

ledger_entries (               -- APPEND-ONLY: sem UPDATE, sem DELETE (revoke + trigger de bloqueio)
  id uuid PK,
  wallet_id uuid FK->wallets NOT NULL,
  tipo ledger_type NOT NULL,   -- RECARGA | HOLD | HOLD_RELEASE | DEBITO_SESSAO
                               -- | REEMBOLSO | REPASSE | COMISSAO | AJUSTE_ADMIN
  valor_centavos bigint NOT NULL,        -- sinal: crédito +, débito −
  session_id uuid FK->sessions NULL,
  idempotency_key text UNIQUE NOT NULL,  -- ex.: 'sess:{id}:min:{n}', 'recarga:{gateway_charge_id}'
  metadata jsonb,
  created_at timestamptz
)
```

Invariantes (enforced por trigger + teste):
- `saldo_centavos` = `SUM(valor_centavos)` das entries da wallet. Job de conciliação verifica; divergência = alerta, nunca "correção" silenciosa.
- Débito de minuto: chave `sess:{session_id}:min:{n}` → retry do worker jamais duplica cobrança.
- HOLD move para `saldo_reservado`; DEBITO_SESSAO consome do reservado; HOLD_RELEASE devolve o não usado.

### 2.3 Sessões e bilhetagem

```sql
sessions (
  id uuid PK,
  patient_id uuid FK NOT NULL,
  psychologist_id uuid FK NOT NULL,
  status session_status NOT NULL,   -- PENDING|ACTIVE|SUSPENDED|ENDED|CANCELLED
  created_at timestamptz,           -- clique em "Falar agora"
  started_at timestamptz,           -- aceite do psicólogo (timestamp do SERVIDOR)
  ended_at timestamptz,
  segundos_cobrados int NOT NULL DEFAULT 0,
  preco_por_minuto_snapshot int NOT NULL,   -- congela preço no início
  take_rate_snapshot numeric(4,3) NOT NULL,
  valor_total_centavos bigint,
  valor_psicologo_centavos bigint,
  valor_plataforma_centavos bigint,
  livekit_room text UNIQUE NOT NULL,
  hb_secret_encrypted bytea NOT NULL,       -- chave HMAC dos heartbeats desta sessão
  motivo_encerramento end_reason,   -- PATIENT_ENDED|PSY_ENDED|NO_BALANCE|TIMEOUT_RECONNECT
                                    -- |PSY_NO_ANSWER|ADMIN|ERROR
  pais_psicologo text,              -- país por IP no aceite (exigência CFP: território nacional)
  ip_psicologo inet
)

session_heartbeats (
  -- operacional fica no Redis; ao encerrar, grava-se AGREGADO por trecho contíguo:
  session_id uuid FK,
  participant_id uuid FK,
  window_start timestamptz,
  window_end timestamptz,
  beats int
)
```

### 2.4 Conformidade e clínica

```sql
consents (
  id uuid PK,
  user_id uuid FK NOT NULL,
  tipo consent_type NOT NULL,   -- TERMO_CONSENTIMENTO | LGPD | RESPONSAVEL_LEGAL
  versao text NOT NULL,         -- ex.: '2026-07-v1'
  aceito_em timestamptz NOT NULL,
  ip inet,
  responsavel_user_id uuid NULL -- quem assinou, no caso de menor
)

crisis_screenings (
  id uuid PK,
  patient_id uuid FK NOT NULL,
  session_id uuid FK NULL,          -- NULL quando bloqueou antes de criar sessão
  resultado screening_result NOT NULL,  -- OK | BLOQUEADO
  encaminhado_em timestamptz,           -- quando mostrou CVV/SAMU/CAPS
  created_at timestamptz
  -- SEM respostas individuais: registra só o desfecho (minimização LGPD)
)

clinical_records (                  -- prontuário
  id uuid PK,
  session_id uuid FK NOT NULL,
  psychologist_id uuid FK NOT NULL, -- ÚNICO com acesso (RLS)
  conteudo_criptografado bytea NOT NULL,
  created_at timestamptz,
  updated_at timestamptz
)

clinical_record_access_log (record_id, actor_id, acao, ip, created_at)  -- trilha de auditoria
```

### 2.5 Marketplace e financeiro

```sql
reviews (session_id PK, nota int CHECK 1..5, comentario text, publicado bool DEFAULT false)

payouts (
  id uuid PK, psychologist_id uuid FK, periodo daterange,
  valor_centavos bigint, status payout_status,  -- PENDING|SENT|CONFIRMED|FAILED
  gateway_ref text, created_at timestamptz
)

platform_settings (key text PK, value jsonb)
-- piso/teto preco_por_minuto, take_rate padrão, minutos mínimos, versões de termos,
-- CRP da PJ + Responsável Técnico (rodapé)

audit_log (id, actor_id, acao, entidade, entidade_id, ip, metadata jsonb, created_at)
```

### 2.6 RLS (Supabase)

| Tabela | Política |
|---|---|
| users/profiles | dono lê/edita o próprio; VERIFIED públicos legíveis (campos de perfil) |
| wallets, ledger_entries | dono lê; **escrita só via service role** (API) |
| sessions | paciente e psicólogo da sessão leem; escrita só service role |
| clinical_records | **só o psicólogo autor** (nem admin lê conteúdo) |
| consents, crisis_screenings | dono lê; escrita service role |
| admin | role ADMIN via claim JWT, exceto conteúdo de prontuário |

Toda escrita financeira/de sessão passa pela API (service role) — RLS protege leitura direta via Supabase client no front.

---

## 3. Máquina de estados da sessão

```
                    validações falham
  "Falar agora" ──────────────────────► (rejeitado c/ motivo)
        │
        ▼
     PENDING ──psicólogo recusa/timeout 30s──► CANCELLED (hold liberado, psicólogo AVAILABLE)
        │
        │ psicólogo aceita (started_at = now() do servidor)
        ▼
      ACTIVE ◄──────────────┐
        │                   │ heartbeats dos 2 lados voltam (janela 60s)
        │ 3 hb perdidos     │
        │ (~15s)            │
        ▼                   │
    SUSPENDED ──────────────┘
        │
        │ 60s sem reconectar
        ▼
      ENDED  ◄── também por: botão encerrar (qualquer lado) · saldo zerou · admin
```

**Validações do "Falar agora"** (nesta ordem, tudo server-side):
1. Consentimentos vigentes (TERMO + LGPD; RESPONSAVEL_LEGAL se menor) — senão redireciona ao fluxo de aceite.
2. **Triagem de crise desta tentativa = OK** — `BLOQUEADO` encerra o fluxo na tela de acolhimento (CVV 188, SAMU 192, 190, CAPS). Triagem é por tentativa de consulta, não "uma vez na vida".
3. Saldo livre ≥ 5 min × preço do psicólogo.
4. Lock atômico no Redis: `SET lock:psy:{id} {session_id} NX EX 45` — perdeu a corrida → "psicólogo acabou de ficar ocupado".
5. Cria sessão PENDING + ledger HOLD + tokens LiveKit (TTL curto, escopo da sala) + notifica psicólogo via WS.

**Encerramento (ENDED), sempre no servidor:**
1. `segundos_cobrados` = soma dos períodos com heartbeat válido dos dois lados (teto: eventos do LiveKit).
2. Cobrança por **minuto iniciado após o 1º minuto completo?** → **Não**: fração configurável; padrão MVP = por minuto completo, mínimo 1 minuto após aceite. (Confirmar na aprovação.)
3. DEBITO_SESSAO final (se fração pendente) + HOLD_RELEASE do restante.
4. `valor_psicologo = round(valor_total × (1 − take_rate))`; `valor_plataforma` = resto (arredondamento sempre a favor do psicólogo, diferença de centavo na plataforma).
5. Enfileira job de repasse (§6) + recibo + pedido de avaliação.

---

## 4. Motor de bilhetagem — runtime

### Redis (verdade operacional)

```
presence:psy:{id}         -> AVAILABLE|BUSY|OFFLINE   (TTL 30s, renovado por WS)
lock:psy:{id}             -> session_id                (NX, EX 45 no ring; renovado enquanto BUSY)
sess:{id}:state           -> hash {status, started_at, paid_seconds, suspended_at}
sess:{id}:hb:{user_id}    -> último beat server-time    (TTL 20s)
```

### Heartbeat
- Cliente (paciente e psicólogo) envia via WS a cada 5s: `{session_id, seq, hmac}`.
- `hmac = HMAC-SHA256(hb_secret_da_sessao, session_id + user_id + seq)` — segredo entregue no início da sessão, nunca reutilizado.
- **Servidor carimba o tempo no recebimento**; qualquer timestamp do cliente é descartado.
- Beat inválido (HMAC errado, seq repetido/regressivo) → descartado + contador de fraude + audit_log.

### Ticker de cobrança
- Worker BullMQ com job repetível por sessão ativa (a cada 10s):
  1. Lê `sess:{id}:hb:*`. Ambos frescos (< 15s)? → acumula tempo decorrido em `paid_seconds`.
  2. Algum lado estagnado ≥ 15s → transiciona SUSPENDED (relógio pausa; ninguém cobra).
  3. SUSPENDED há ≥ 60s → ENDED (`TIMEOUT_RECONNECT`), cobra até o último beat válido do lado que caiu.
  4. Cruzou minuto completo `n` → `INSERT ledger_entries (DEBITO_SESSAO, 'sess:{id}:min:{n}')` — corrida/retry seguros pela unique key.
  5. Saldo restante ≤ 5 min → evento WS `low_balance` (ambos os lados); ≤ 2 min → `critical_balance`; 0 → encerra com aviso de 30s.
- **Confirmação cruzada**: webhooks do LiveKit (`participant_joined/left`, assinados) gravados em Redis; ticker só conta tempo se o LiveKit também vê os dois participantes na sala. Heartbeat sem sala real = fraude, não cobra e alerta.

### Idempotência e replay
- API de operações financeiras exige header `Idempotency-Key`; internamente toda entry tem chave determinística.
- Crash do worker: estado reconstrutível de Redis + ledger; na retomada, minutos já lançados não repetem (unique key).

---

## 5. Fluxo de recarga (Pix)

1. Paciente escolhe pacote (R$50/100/200) ou valor livre → API cria cobrança Pix no gateway → devolve QR + copia-e-cola.
2. Webhook `payment.confirmed` (assinatura verificada + consulta ativa de confirmação) → `INSERT ledger RECARGA` com `idempotency_key = 'recarga:{gateway_charge_id}'` → saldo atualizado → push WS pro front.
3. Cartão (secundário): mesma mecânica, só como recarga avulsa — **nunca** captura incremental por minuto.

---

## 6. Split e repasse — nuance importante ⚠️

A ideia de "split na origem" funciona quando cada cobrança já tem destinatário. **No modelo de carteira pré-paga, a recarga acontece antes de saber qual psicólogo vai atender** — logo o split não pode ocorrer na recarga.

Desenho proposto (mantém a plataforma fora da custódia regulatória):

1. Recarga Pix entra na **conta da plataforma dentro do gateway** (a custódia é do gateway — instituição de pagamento regulada; a plataforma nunca toca o dinheiro fora dele).
2. Cada psicólogo tem **subconta/recebedor no gateway** (onboarding com KYC, CPF/CNPJ, conta bancária) — pré-condição para atender.
3. No ENDED, job de repasse cria **transferência interna gateway → subconta do psicólogo** no valor `valor_psicologo`, com idempotency key da sessão. Comissão permanece na conta da plataforma. No Asaas, transferência entre contas Asaas é instantânea e sem custo; psicólogo saca para o banco quando quiser (ou auto-saque agendado).
4. Job diário de conciliação: `SUM(ledger)` × extrato do gateway × transferências → relatório de divergência no admin.

Por isso **Asaas** como recomendação primária (subcontas white-label + transferências internas encaixam direto). Pagar.me também atende (recipients + transferências), com mais atrito no onboarding de recebedor. Decisão final na aprovação — nada de mock: sandbox real desde o primeiro commit de billing.

Repasse: padrão **por sessão** (D+0 na subconta). Alternativa: consolidado diário (menos ruído no extrato). Confirmar preferência.

---

## 7. Vertical slices (ordem de implementação — Sprint 1)

| # | Slice | Entrega verificável |
|---|---|---|
| 0 | Fundação | monorepo, CI, Supabase (migrations + RLS), Redis, deploy dev |
| 1 | Auth + consentimentos | signup paciente/psicólogo, termos versionados, fluxo menor de idade |
| 2 | Verificação CRP (admin) | fila de verificação, aprova/reprova, audit_log |
| 3 | Carteira + Pix | recarga sandbox real, ledger append-only, extrato |
| 4 | Presença + chamada | toggle disponibilidade, "Falar agora", aceite, sala LiveKit 1:1 |
| 5 | **Motor de bilhetagem** | heartbeat HMAC, ticker, débito/minuto, SUSPENDED/reconexão, avisos de saldo, encerramento justo + suite de testes obrigatória |
| 6 | Triagem de crise | bloqueante antes do slice 4 ir a produção; tela de acolhimento CVV/SAMU/CAPS; banner permanente |
| 7 | Split/repasse | onboarding recebedor, transferência pós-sessão, conciliação diária |
| 8 | Admin mínimo | sessões, disputas básicas, conciliação, métricas |

(Triagem implementada antes do fluxo de consulta abrir para usuário real — ordem de deploy respeita isso ainda que o desenvolvimento do slice 4 comece antes.)

Testes obrigatórios do motor (slice 5): minuto exato · queda de conexão (pausa e cobrança justa) · saldo zerando no meio · duas tentativas simultâneas no mesmo psicólogo · heartbeat forjado/replay/relógio adiantado · idempotência de débito sob retry e crash do worker.

---

## 8. Decisões abertas para aprovação

1. **Backend**: Fastify (recomendado) vs NestJS.
2. **Gateway**: Asaas (recomendado, §6) vs Pagar.me.
3. **LiveKit**: Cloud (recomendado no MVP) vs self-host.
4. **Fração de cobrança**: minuto completo (recomendado) vs frações (30s/15s).
5. **Repasse**: por sessão D+0 (recomendado) vs consolidado diário.
