# Deploy KHOROS no Coolify

Guia para subir o monorepo (web + api + Redis) no Coolify com Docker Compose.

Stack na imagem: `web` (Next.js standalone), `api` (Fastify), `redis` (obrigatório em produção). Postgres/Auth ficam no **Supabase**; vídeo no **LiveKit Cloud**; Pix/split no **Asaas** — só URLs/chaves via env.

## Pré-requisitos

- Servidor Coolify com Docker
- Projeto Supabase com migrations aplicadas (`packages/db`)
- Contas LiveKit Cloud + Asaas (sandbox ou produção)
- Domínios (ex.: `app.khoros.com.br` → web, `api.khoros.com.br` → api)

## 1. Migrations (antes ou logo após o primeiro deploy)

As migrations **não** rodam automaticamente no container. Aplique no Supabase a partir de uma máquina com `DATABASE_URL`:

```bash
# na raiz do monorepo, com .env preenchido ou exportando DATABASE_URL
pnpm --filter @khoros/db migrate
```

Confirme no dashboard Supabase que as tabelas/RLS existem.

## 2. Criar o recurso no Coolify

1. **New Resource** → **Docker Compose** (ou “Docker Compose Empty”).
2. Conecte o repositório Git (branch de produção).
3. **Base Directory:** `/` (raiz do monorepo).
4. **Compose file:** `docker-compose.yml`.
5. Coolify fará build com context na raiz (Dockerfiles em `apps/api` e `apps/web`).

Alternativa: dois recursos “Dockerfile” separados + um Redis gerenciado — use os mesmos Dockerfiles (`apps/*/Dockerfile`) com **Build Context** = raiz do repo. O compose é o caminho recomendado (Redis incluso e rede interna).

## 3. Domínios e portas

| Serviço | Porta interna | Domínio sugerido |
|---------|---------------|------------------|
| `web`   | `3000` (`WEB_PORT`) | `https://app.seu-dominio` (ou apex) |
| `api`   | `3001` (`API_PORT`) | `https://api.seu-dominio` |
| `redis` | `6379`              | **não** expor publicamente |

No Coolify, em cada serviço do compose, atribua o domínio e a porta do container correspondente. TLS fica na borda (Traefik/Caddy do Coolify). A API já usa `trustProxy`.

## 4. Variáveis de ambiente

Copie de `.env.example`. No Coolify, defina no **Environment** do recurso (não commitar `.env`).

### Obrigatórias — API (`api`)

| Variável | Notas |
|----------|--------|
| `NODE_ENV` | `production` |
| `HOST` | `0.0.0.0` (já no compose) |
| `API_PORT` | Compose mapeia para `PORT` do processo (`3001`). Evita colisão com `PORT` global do Coolify. |
| `REDIS_URL` | Compose default: `redis://redis:6379` |
| `DATABASE_URL` | Connection string Supabase (direta ou pooler) |
| `SUPABASE_URL` | URL do projeto |
| `SUPABASE_SECRET_KEY` | `sb_secret_…` — **nunca** no browser |
| `SUPABASE_JWKS_URL` | `…/auth/v1/.well-known/jwks.json` |
| `LIVEKIT_URL` / `LIVEKIT_API_KEY` / `LIVEKIT_API_SECRET` | Cloud |
| `LIVEKIT_WEBHOOK_KEY` | Assinatura dos webhooks |
| `ASAAS_BASE_URL` / `ASAAS_API_KEY` / `ASAAS_WEBHOOK_TOKEN` | Gateway — ver nota Asaas abaixo |
| `COLUMN_ENCRYPTION_KEY` | `openssl rand -hex 32` |
| `WEB_ORIGIN` | URL **pública** do front, ex. `https://app.seu-dominio` (CORS) |

Opcionais: `SUPABASE_PUBLISHABLE_KEY`, `SENTRY_DSN`, `BOOTSTRAP_ADMIN_EMAIL`, `LIVEKIT_WEBHOOK_KEY`.

**Asaas (placeholders OK):** sem sandbox/produção ainda, use `ASAAS_API_KEY=FALTA_ASAAS_API_KEY` e `ASAAS_WEBHOOK_TOKEN=FALTA_ASAAS_WEBHOOK_TOKEN` (mesmo padrão do `.env` local). Pix fica indisponível; o restante da API sobe. Troque por chaves reais depois e reinicie o serviço `api` (rebuild não é necessário).

**Não deixe opcionais como string vazia no Coolify** (`SENTRY_DSN=`, `BOOTSTRAP_ADMIN_EMAIL=`, etc.). Melhor **omitir** a chave do que enviar `""` — strings vazias quebram validação de URL/e-mail. A API já trata `""` como unset, mas omitir evita surpresas.

Se o serviço `api` ficar **unhealthy** logo após o start (~2s), é quase sempre crash no boot (env inválido), não healthcheck lento. Abra os **logs** do `api` e procure `Configuração inválida`.

Em produção a API **recusa boot** se Redis não responder (sem fallback em memória).

### Obrigatórias — Web (build-args + runtime)

`NEXT_PUBLIC_*` entra no **build** da imagem. Se mudar URL pública da API/site, **rebuild** o serviço `web`.

| Variável | Notas |
|----------|--------|
| `NEXT_PUBLIC_SITE_URL` | URL pública do site |
| `NEXT_PUBLIC_API_URL` | URL pública da API (HTTPS) |
| `NEXT_PUBLIC_SUPABASE_URL` | Mesmo projeto |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | `sb_publishable_…` |
| `NEXT_PUBLIC_LIVEKIT_URL` | `wss://…` |

Runtime (server-only no `web`):

| Variável | Notas |
|----------|--------|
| `SUPABASE_SERVICE_ROLE_KEY` | Leads/eventos do blog (se usar) |
| `N8N_WEBHOOK_URL` | Opcional |
| `WEB_PORT` | Default `3000` |

Alinhe:

- `WEB_ORIGIN` (API) = `NEXT_PUBLIC_SITE_URL` (web)
- `NEXT_PUBLIC_API_URL` = domínio público da API

## 5. Webhooks (URLs públicas da API)

Após o domínio da API estar no ar:

| Integração | URL |
|------------|-----|
| **Asaas** | `https://api.seu-dominio/webhooks/asaas` |
| **LiveKit** | `https://api.seu-dominio/webhooks/livekit` |

Configure o token/assinatura para bater com `ASAAS_WEBHOOK_TOKEN` e `LIVEKIT_WEBHOOK_KEY`.

## 6. Build e start (referência local)

Coolify executa o compose; localmente (com Docker):

```bash
# Validar compose
docker compose config

# Build (precisa das NEXT_PUBLIC_* e secrets da API no ambiente/shell)
export NEXT_PUBLIC_SITE_URL=https://app.exemplo
export NEXT_PUBLIC_API_URL=https://api.exemplo
# … demais vars do .env.example …
docker compose build
docker compose up -d

# Health
curl -sS https://api.exemplo/health   # ou http://localhost mapeado
curl -sS -o /dev/null -w "%{http_code}\n" https://app.exemplo/
```

Imagens individuais:

```bash
docker build -f apps/api/Dockerfile -t khoros-api .
docker build -f apps/web/Dockerfile \
  --build-arg NEXT_PUBLIC_SITE_URL=... \
  --build-arg NEXT_PUBLIC_API_URL=... \
  --build-arg NEXT_PUBLIC_SUPABASE_URL=... \
  --build-arg NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=... \
  --build-arg NEXT_PUBLIC_LIVEKIT_URL=... \
  -t khoros-web .
```

## 7. Checklist pós-deploy

- [ ] `GET /health` na API → `status: ok`, `storeMode: "redis"`
- [ ] Home/blog carrega no domínio web
- [ ] Login Supabase (redirect URLs no dashboard: domínio web)
- [ ] CORS: front chama API sem erro (`WEB_ORIGIN` correto)
- [ ] Webhook Asaas de teste credita carteira
- [ ] Webhook LiveKit chega (logs da API)
- [ ] Triagem de crise + banner CVV 188 acessíveis
- [ ] Migrations aplicadas; nenhum secret no Git

## 8. Escala e limites

- Redis é shared state (locks, presença, bilhetagem). Não rode várias réplicas da API **sem** Redis estável.
- Não grave sessões de vídeo; LiveKit Cloud cuida da mídia.
- Rebuild `web` sempre que alterar `NEXT_PUBLIC_*`.
