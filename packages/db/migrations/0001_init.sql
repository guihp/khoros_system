-- KHOROS — schema inicial
-- Dinheiro sempre em centavos (bigint). Timestamps sempre timestamptz (UTC).

create extension if not exists pgcrypto;

-- ─── Enums ───────────────────────────────────────────────────────────────────

create type user_role as enum ('PATIENT', 'PSYCHOLOGIST', 'ADMIN');
create type user_status as enum ('ACTIVE', 'SUSPENDED', 'DELETED');
create type crp_status as enum ('PENDING', 'VERIFIED', 'REJECTED', 'REVOKED');
create type availability as enum ('AVAILABLE', 'BUSY', 'OFFLINE');
create type session_status as enum ('PENDING', 'ACTIVE', 'SUSPENDED', 'ENDED', 'CANCELLED');
create type end_reason as enum (
  'PATIENT_ENDED', 'PSY_ENDED', 'NO_BALANCE', 'TIMEOUT_RECONNECT',
  'PSY_NO_ANSWER', 'ADMIN', 'ERROR'
);
create type ledger_type as enum (
  'RECARGA', 'HOLD', 'HOLD_RELEASE', 'DEBITO_SESSAO',
  'REEMBOLSO', 'REPASSE', 'COMISSAO', 'AJUSTE_ADMIN'
);
create type consent_type as enum ('TERMO_CONSENTIMENTO', 'LGPD', 'RESPONSAVEL_LEGAL');
create type screening_result as enum ('OK', 'BLOQUEADO');
create type payout_status as enum ('PENDING', 'SENT', 'CONFIRMED', 'FAILED');

-- ─── Identidade e perfis ─────────────────────────────────────────────────────

create table users (
  id uuid primary key,                       -- = auth.users.id (Supabase)
  role user_role not null,
  email text unique not null,
  full_name text not null,
  public_nickname text,
  cpf_encrypted bytea,                       -- cifra de coluna; nunca em claro
  status user_status not null default 'ACTIVE',
  created_at timestamptz not null default now()
);

create table psychologist_profiles (
  user_id uuid primary key references users (id),
  crp_numero text not null,
  crp_regiao text not null,
  crp_status crp_status not null default 'PENDING',
  verificado_em timestamptz,
  verificado_por uuid references users (id),
  bio text,
  abordagens text[] not null default '{}',
  especialidades text[] not null default '{}',
  foto_url text,
  preco_por_minuto_centavos integer not null check (preco_por_minuto_centavos > 0),
  take_rate numeric(4, 3) not null default 0.200 check (take_rate >= 0 and take_rate < 1),
  recebedor_gateway_id text,
  disponibilidade availability not null default 'OFFLINE',
  unique (crp_numero, crp_regiao)
);

create table patient_profiles (
  user_id uuid primary key references users (id),
  cidade text,
  data_nascimento date not null,
  responsavel_legal_id uuid references users (id)
);

-- ─── Carteira e ledger (append-only) ─────────────────────────────────────────

create table wallets (
  user_id uuid primary key references users (id),
  saldo_centavos bigint not null default 0 check (saldo_centavos >= 0),
  saldo_reservado_centavos bigint not null default 0 check (saldo_reservado_centavos >= 0),
  updated_at timestamptz not null default now()
);

create table sessions (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references users (id),
  psychologist_id uuid not null references users (id),
  status session_status not null default 'PENDING',
  created_at timestamptz not null default now(),
  started_at timestamptz,
  ended_at timestamptz,
  segundos_cobrados integer not null default 0 check (segundos_cobrados >= 0),
  preco_por_minuto_snapshot integer not null,
  take_rate_snapshot numeric(4, 3) not null,
  valor_total_centavos bigint,
  valor_psicologo_centavos bigint,
  valor_plataforma_centavos bigint,
  livekit_room text unique not null,
  hb_secret_encrypted bytea not null,
  motivo_encerramento end_reason,
  pais_psicologo text,
  ip_psicologo inet,
  check (patient_id <> psychologist_id)
);
create index sessions_patient_idx on sessions (patient_id, created_at desc);
create index sessions_psy_idx on sessions (psychologist_id, created_at desc);
create index sessions_status_idx on sessions (status) where status in ('PENDING', 'ACTIVE', 'SUSPENDED');

create table ledger_entries (
  id uuid primary key default gen_random_uuid(),
  wallet_id uuid not null references wallets (user_id),
  tipo ledger_type not null,
  valor_centavos bigint not null,          -- crédito +, débito −
  session_id uuid references sessions (id),
  idempotency_key text unique not null,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);
create index ledger_wallet_idx on ledger_entries (wallet_id, created_at desc);
create index ledger_session_idx on ledger_entries (session_id) where session_id is not null;

-- Append-only: bloqueia UPDATE/DELETE no nível do banco, para qualquer role.
create or replace function forbid_mutation() returns trigger
language plpgsql as $$
begin
  raise exception 'ledger_entries é append-only (% proibido)', tg_op;
end $$;

create trigger ledger_append_only
  before update or delete on ledger_entries
  for each row execute function forbid_mutation();

-- Saldo materializado: mantido pelo próprio banco a partir dos eventos.
-- HOLD move livre→reservado; DEBITO consome reservado; HOLD_RELEASE devolve.
--
-- Convenção de sinais: HOLD é negativo, HOLD_RELEASE é positivo, DEBITO_SESSAO
-- é negativo, RECARGA/REEMBOLSO positivos. Invariantes de conciliação:
--   saldo_centavos + saldo_reservado_centavos
--     = Σ valor_centavos WHERE tipo NOT IN ('HOLD','HOLD_RELEASE')  [dinheiro real]
--   saldo_reservado_centavos
--     = −Σ HOLD − Σ HOLD_RELEASE − Σ DEBITO_SESSAO                  [reserva viva]
-- Os CHECKs de wallets (>= 0) fazem o banco rejeitar débito além do reservado
-- e hold além do saldo — última linha de defesa contra bug no motor.
create or replace function apply_ledger_entry() returns trigger
language plpgsql as $$
begin
  if new.tipo = 'HOLD' then
    -- valor negativo: sai do saldo livre, entra no reservado
    update wallets
       set saldo_centavos = saldo_centavos + new.valor_centavos,
           saldo_reservado_centavos = saldo_reservado_centavos - new.valor_centavos,
           updated_at = now()
     where user_id = new.wallet_id;
  elsif new.tipo = 'HOLD_RELEASE' then
    -- valor positivo: volta do reservado para o livre
    update wallets
       set saldo_centavos = saldo_centavos + new.valor_centavos,
           saldo_reservado_centavos = saldo_reservado_centavos - new.valor_centavos,
           updated_at = now()
     where user_id = new.wallet_id;
  elsif new.tipo = 'DEBITO_SESSAO' then
    -- valor negativo: consome o reservado
    update wallets
       set saldo_reservado_centavos = saldo_reservado_centavos + new.valor_centavos,
           updated_at = now()
     where user_id = new.wallet_id;
  else
    update wallets
       set saldo_centavos = saldo_centavos + new.valor_centavos,
           updated_at = now()
     where user_id = new.wallet_id;
  end if;
  return new;
end $$;

create trigger ledger_apply
  after insert on ledger_entries
  for each row execute function apply_ledger_entry();

-- Agregado de heartbeats por trecho contíguo (operacional fica no Redis).
create table session_heartbeat_windows (
  session_id uuid not null references sessions (id),
  participant_id uuid not null references users (id),
  window_start timestamptz not null,
  window_end timestamptz not null,
  beats integer not null,
  primary key (session_id, participant_id, window_start)
);

-- ─── Conformidade e clínica ──────────────────────────────────────────────────

create table consents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users (id),
  tipo consent_type not null,
  versao text not null,
  aceito_em timestamptz not null default now(),
  ip inet,
  responsavel_user_id uuid references users (id)
);
create index consents_user_idx on consents (user_id, tipo, aceito_em desc);

create table crisis_screenings (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references users (id),
  session_id uuid references sessions (id),
  resultado screening_result not null,
  encaminhado_em timestamptz,               -- quando exibiu CVV/SAMU/CAPS
  created_at timestamptz not null default now()
  -- Sem respostas individuais: registra só o desfecho (minimização LGPD).
);
create index screenings_patient_idx on crisis_screenings (patient_id, created_at desc);

create table clinical_records (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references sessions (id),
  psychologist_id uuid not null references users (id),
  conteudo_criptografado bytea not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (session_id)
);

create table clinical_record_access_log (
  id uuid primary key default gen_random_uuid(),
  record_id uuid not null references clinical_records (id),
  actor_id uuid not null references users (id),
  acao text not null,                       -- READ | WRITE
  ip inet,
  created_at timestamptz not null default now()
);

-- ─── Marketplace e financeiro ────────────────────────────────────────────────

create table reviews (
  session_id uuid primary key references sessions (id),
  nota integer not null check (nota between 1 and 5),
  comentario text,
  publicado boolean not null default false,
  created_at timestamptz not null default now()
);

create table payouts (
  id uuid primary key default gen_random_uuid(),
  psychologist_id uuid not null references users (id),
  session_id uuid references sessions (id),
  valor_centavos bigint not null check (valor_centavos > 0),
  status payout_status not null default 'PENDING',
  idempotency_key text unique not null,
  gateway_ref text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index payouts_psy_idx on payouts (psychologist_id, created_at desc);

create table platform_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

insert into platform_settings (key, value) values
  ('preco_por_minuto_piso_centavos', '200'),
  ('preco_por_minuto_teto_centavos', '1500'),
  ('take_rate_padrao', '0.20'),
  ('minutos_minimos_sessao', '5'),
  ('versao_termo_consentimento', '"2026-07-v1"'),
  ('versao_termo_lgpd', '"2026-07-v1"'),
  ('pj_crp_inscricao', '""'),               -- inscrição da PJ no CRP (rodapé)
  ('pj_responsavel_tecnico', '""');         -- Psicólogo(a) Responsável Técnico(a)

create table audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references users (id),
  acao text not null,
  entidade text not null,
  entidade_id text,
  ip inet,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);
create index audit_log_idx on audit_log (entidade, entidade_id, created_at desc);
