# KHOROS

Marketplace de consultas de psicologia por vídeo, sob demanda, pago por minuto via carteira pré-paga (Pix).

> **Regra de ouro:** primeiro o cuidado com a pessoa (triagem de crise, sigilo, consentimento, conformidade CFP), depois a tecnologia. Leia `CLAUDE.md` e `docs/ARCHITECTURE.md` antes de mexer em qualquer coisa.

## Stack

Monorepo pnpm + Turborepo · Next.js (web) · Fastify (api) · PostgreSQL/Supabase · Redis · LiveKit Cloud (vídeo) · Asaas (Pix + repasse) · BullMQ (jobs).

## Estrutura

```
apps/web         Next.js — paciente, psicólogo (/pro) e admin (/admin)
apps/api         Fastify — REST + WebSocket + workers (motor de bilhetagem)
packages/shared  Tipos, constantes e regras de dinheiro compartilhadas
packages/db      Migrations SQL + políticas RLS
docs/            ARCHITECTURE.md (aprovado) e decisões
```

## Setup local

Pré-requisitos: Node ≥ 22, pnpm ≥ 10, Docker (para Redis), contas: Supabase, LiveKit Cloud, Asaas sandbox.

```bash
# 1. Dependências
pnpm install

# 2. Ambiente
cp .env.example .env       # preencha com suas chaves (ver comentários no arquivo)

# 3. Redis local
docker run -d --name khoros-redis -p 6379:6379 redis:7

# 4. Banco (aplica migrations no Supabase)
DATABASE_URL=... pnpm --filter @khoros/db migrate

# 5. Desenvolvimento
pnpm dev                   # web em :3000, api em :3001
```

## Testes

```bash
pnpm test                  # inclui a suite obrigatória do motor de bilhetagem
```

A suite do motor (`apps/api/src/modules/billing/*.test.ts`) cobre: minuto exato, queda de conexão, saldo zerando, corrida pelo mesmo psicólogo, fraude de relógio/replay de heartbeat e idempotência de débito. **Nenhuma mudança no motor entra sem esses testes verdes.**

## Regras que o código nunca pode violar

- Tempo de sessão medido só pelo servidor; timestamps de cliente são descartados.
- `ledger_entries` é append-only (trigger bloqueia UPDATE/DELETE); toda operação financeira tem chave de idempotência.
- Sem gravação de vídeo/áudio de sessões. Sem logs de conteúdo clínico.
- Triagem de crise bloqueante antes de qualquer consulta; banner de apoio (CVV 188) em todas as páginas.
- Prontuário legível apenas pelo psicólogo autor (RLS) — nem admin.
- Pagamento sem custódia própria: recarga e repasse vivem no gateway regulado (Asaas).
- Billing/pagamento sempre contra sandbox real do gateway — nunca mock.
