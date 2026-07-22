# KHOROS

Marketplace de consultas de psicologia por vídeo, sob demanda, pago por minuto via carteira pré-paga (Pix).

> **Regra de ouro:** primeiro o cuidado com a pessoa (triagem de crise, sigilo, consentimento, conformidade CFP), depois a tecnologia. Leia `CLAUDE.md` e `docs/ARCHITECTURE.md` antes de mexer em qualquer coisa.

## Stack

Monorepo pnpm + Turborepo · Next.js (web) · Fastify (api) · PostgreSQL/Supabase · Redis · LiveKit Cloud (vídeo) · Asaas (Pix + repasse) · BullMQ (jobs).

## Estrutura

```
apps/web         Next.js — home/blog (marketing) + app (paciente, /pro, /admin)
apps/api         Fastify — REST + WebSocket + workers (motor de bilhetagem)
packages/shared  Tipos, constantes e regras de dinheiro compartilhadas
packages/db      Migrations SQL + políticas RLS
docs/            ARCHITECTURE.md (aprovado) e decisões
blog-khoros/     Fonte original do blog Onda 0 (já integrado em apps/web)
```

**Home:** `/` é o blog de saúde mental. **Entrar** no header leva a `/entrar` (login da plataforma). Artigos em `/blog`; a app autenticada continua em `/paciente`, `/pro`, etc.

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

## Testar chamada de vídeo no celular (HTTPS local)

`navigator.mediaDevices` (câmera/microfone) só existe em **contexto seguro**:
HTTPS, ou `http://localhost`/`127.0.0.1`. Abrir o app pelo IP da rede local em
HTTP (ex. `http://192.168.x.x:3000`, comum ao testar no celular) deixa
`mediaDevices` `undefined` e quebra a sala — mesmo que a URL do LiveKit já
seja `wss://` (cloud). Para testar no celular:

```bash
# 1. Gere um certificado local (mkcert) válido para localhost + IP da sua rede
pnpm gen-certs              # requer mkcert: brew install mkcert

# 2. Suba web + api em HTTPS
pnpm dev:https              # web em https://0.0.0.0:3000, api em https://0.0.0.0:3001
```

- **Computador:** acesse `https://localhost:3000` (ou `http://localhost:3000`
  com `pnpm dev` normal — ambos são contexto seguro).
- **Celular (mesma Wi‑Fi):** acesse `https://<IP-da-sua-máquina>:3000`. O
  certificado é autoassinado (mkcert), então o navegador vai avisar que o
  site "não é confiável" — toque em "Avançado → Continuar" (Chrome/Android)
  ou "Mostrar detalhes → Visitar este site" (Safari/iOS) uma vez; depois disso
  a página carrega normalmente em HTTPS e a câmera/microfone funcionam.
- O cliente web promove `http→https` automaticamente na URL da API quando a
  própria página está em HTTPS, então não precisa editar `NEXT_PUBLIC_API_URL`
  para trocar de modo.
- Se o certificado não estiver instalado como confiável (`mkcert -install`
  pede senha de admin e não roda em ambientes não interativos), é só aceitar
  o aviso do navegador uma vez — a conexão continua criptografada e conta
  como contexto seguro.

## Deploy (Coolify)

Produção via Docker Compose (`web` + `api` + `redis`). Guia completo: [`docs/DEPLOY-COOLIFY.md`](docs/DEPLOY-COOLIFY.md).

```bash
# Validar / build local (requer Docker)
docker compose config
docker compose build
```

Resumo Coolify: recurso **Docker Compose** na raiz → `docker-compose.yml` → env a partir de `.env.example` → domínio web `:3000` e API `:3001` → migrations com `pnpm --filter @khoros/db migrate` → webhooks Asaas/LiveKit em `https://<api-pública>/webhooks/...`.

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
