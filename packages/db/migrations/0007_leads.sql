-- KHOROS — Captura de leads (Onda 0: waitlist + artigos do blog).
-- Escrita apenas via API com service_role (POST /api/leads).

create table leads (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) >= 2),
  email text not null,
  city text not null default 'online',
  article_slug text,
  article_category text,
  article_title text,
  source text not null default 'article',
  consent boolean not null default true check (consent = true),
  consent_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create unique index leads_email_source_unique on leads (lower(email), source);

alter table leads enable row level security;
-- Sem policies: leitura/escrita só via service_role (bypassa RLS).
