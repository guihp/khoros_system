/**
 * Constantes de negócio da KHOROS.
 * Valores operacionais (piso/teto de preço, take rate) vivem em platform_settings
 * no banco; aqui ficam apenas os defaults e os parâmetros do motor de bilhetagem.
 */

/** Intervalo esperado entre heartbeats de cada participante (ms). */
export const HEARTBEAT_INTERVAL_MS = 5_000;

/**
 * Sem heartbeat de um participante por este período, a sessão é suspensa
 * (3 batimentos perdidos). O relógio pausa e nada é cobrado.
 */
export const HEARTBEAT_STALE_MS = 15_000;

/** Janela de reconexão em SUSPENDED antes do encerramento definitivo (ms). */
export const RECONNECT_WINDOW_MS = 60_000;

/** Saldo mínimo exigido para iniciar consulta, em minutos do preço do psicólogo. */
export const MIN_SESSION_MINUTES = 5;

/** Granularidade de cobrança: minuto completo (decisão aprovada 14/07/2026). */
export const BILLING_UNIT_SECONDS = 60;

/** Mínimo cobrado após o aceite do psicólogo, em unidades de cobrança. */
export const MIN_BILLED_UNITS = 1;

/** Avisos de saldo baixo, em minutos restantes de conversa. */
export const LOW_BALANCE_WARN_MINUTES = 5;
export const CRITICAL_BALANCE_WARN_MINUTES = 2;

/** Aviso prévio antes do encerramento por saldo zerado (ms). */
export const ZERO_BALANCE_GRACE_MS = 30_000;

/** Timeout para o psicólogo aceitar a chamada entrante (ms). */
export const CALL_ACCEPT_TIMEOUT_MS = 30_000;

/**
 * Backup de polling: enquanto a sessão está PENDING (sala de espera do
 * paciente), consulta GET /sessions/:id neste intervalo para o caso do
 * evento WS de recusa/cancelamento se perder (conexão ainda não
 * estabelecida, socket caiu, etc.).
 */
export const PENDING_STATUS_POLL_MS = 4_000;

/** Take rate padrão da plataforma (fração). Configurável por profissional. */
export const DEFAULT_TAKE_RATE = 0.2;

/** Pacotes de recarga sugeridos, em centavos. Valor livre também é aceito. */
export const TOPUP_PACKAGES_CENTS = [5_000, 10_000, 20_000] as const;

/** Recarga por valor livre: limites em centavos. */
export const TOPUP_MIN_CENTS = 1_000;
export const TOPUP_MAX_CENTS = 200_000;

/** Limite de caracteres da bio pública do psicólogo. */
export const BIO_MAX_LENGTH = 500;

/** Limite do arquivo de avatar do psicólogo (bytes). */
export const AVATAR_MAX_BYTES = 2 * 1024 * 1024;

/**
 * Canais de emergência exibidos quando a triagem de crise bloqueia a consulta.
 * NUNCA remover nem esconder — exigência de conformidade CFP.
 */
export const CRISIS_CHANNELS = [
  { nome: "CVV — Centro de Valorização da Vida", contato: "188", detalhe: "24h, gratuito. Chat em cvv.org.br" },
  { nome: "SAMU", contato: "192", detalhe: "Emergências médicas" },
  { nome: "Emergência policial", contato: "190", detalhe: "Situações de violência ou risco imediato" },
  { nome: "CAPS", contato: "Unidade da sua região", detalhe: "Centro de Atenção Psicossocial — atendimento presencial" },
] as const;
