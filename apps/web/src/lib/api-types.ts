import type {
  Availability,
  CrpStatus,
  ScreeningResult,
  UserRole,
  UserStatus,
} from "@khoros/shared";

/**
 * Formatos de resposta da API KHOROS (Fastify). Espelham exatamente os
 * `select()` do Supabase nas rotas — por isso muitos campos ficam em
 * snake_case (vindos direto do Postgres), enquanto payloads de request/response
 * específicos da API (ex.: sessão, triagem) usam camelCase.
 */

export interface PatientProfileApi {
  cidade: string | null;
  data_nascimento: string;
  responsavel_legal_id?: string | null;
  foto_url?: string | null;
  bio?: string | null;
  mostrar_nome_real?: boolean;
  camera_ligada_padrao?: boolean;
}


export interface PsychologistProfileApi {
  crp_numero: string;
  crp_regiao: string;
  crp_status: CrpStatus;
  bio: string | null;
  abordagens: string[] | null;
  especialidades: string[] | null;
  foto_url: string | null;
  preco_por_minuto_centavos: number;
  take_rate: number;
  recebedor_gateway_id: string | null;
  disponibilidade: Availability;
}

export type MeResponse =
  | {
      registered: true;
      id: string;
      role: UserRole;
      email: string;
      full_name: string;
      public_nickname: string | null;
      status: UserStatus;
      created_at: string;
      profile?: PatientProfileApi | PsychologistProfileApi | null;
      isMinor?: boolean;
    }
  | { registered: false; email: string };

export interface ConsentStatusResponse {
  termoOk: boolean;
  lgpdOk: boolean;
  isMinor: boolean;
  responsavelLegalOk: boolean;
  versaoTermo: string;
  versaoLgpd: string;
}

export interface PsychologistListItem {
  user_id: string;
  bio: string | null;
  abordagens: string[] | null;
  especialidades: string[] | null;
  foto_url: string | null;
  preco_por_minuto_centavos: number;
  disponibilidade: Availability;
  crp_numero: string;
  crp_regiao: string;
  users: { full_name: string } | null;
  /** Estatísticas compactas para badges (contagem/estrelas) no cardápio. */
  consultasRealizadas?: number;
  mediaAvaliacao?: number | null;
  totalAvaliacoes?: number;
}

export interface ReviewListItem {
  nota: number;
  comentario: string | null;
  criadoEm: string;
}

export interface AvaliacaoSummary {
  media: number | null;
  total: number;
  itens: ReviewListItem[];
}

export type PsychologistPublicProfile = PsychologistListItem & {
  consultasRealizadas: number;
  avaliacao: AvaliacaoSummary;
};

export interface PsychologistsListResponse {
  items: PsychologistListItem[];
}

export interface AvatarUploadResponse {
  foto_url: string;
}

export interface WalletSummary {
  saldo_centavos: number;
  saldo_reservado_centavos: number;
  updated_at: string;
}

export interface LedgerEntry {
  id: string;
  tipo: string;
  valor_centavos: number;
  session_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface LedgerResponse {
  items: LedgerEntry[];
  limit: number;
  offset: number;
}

export interface TopupResponse {
  paymentId: string;
  status: string;
  valorCentavos: number;
  qrCodeImage?: string | null;
  qrCodePayload?: string | null;
  expirationDate?: string | null;
  invoiceUrl?: string | null;
}

/** POST /sessions/start */
export interface StartSessionResponse {
  sessionId: string;
  livekitRoom: string;
  livekitUrl: string;
  patientToken: string;
  acceptTimeoutMs: number;
  hbSecret: string;
}

/** POST /sessions/:id/accept */
export interface AcceptSessionResponse {
  psychologistToken: string;
  livekitRoom: string;
  livekitUrl: string;
  hbSecret: string;
}

/**
 * GET /sessions/:id. `patientToken`/`psychologistToken`/`livekitToken` e
 * `hbSecret`/`livekitUrl` são best-effort (só presentes se o runtime ainda
 * tiver a sessão em memória) — o caminho principal é usar as credenciais
 * salvas em sessionStorage no start/accept (ver lib/session-storage.ts).
 */
export interface SessionDetail {
  id: string;
  patient_id: string;
  psychologist_id: string;
  status: string;
  created_at: string;
  started_at: string | null;
  ended_at: string | null;
  segundos_cobrados: number | null;
  preco_por_minuto_snapshot: number;
  valor_total_centavos: number | null;
  valor_psicologo_centavos: number | null;
  valor_plataforma_centavos: number | null;
  livekit_room: string;
  motivo_encerramento: string | null;
  livekitUrl?: string;
  hbSecret?: string;
  patientToken?: string;
  psychologistToken?: string;
  livekitToken?: string;
}

/** POST /sessions/:id/review e GET /sessions/:id/review. */
export interface SessionReview {
  sessionId: string;
  nota: number;
  comentario: string | null;
  publicado: boolean;
  criadoEm: string;
}

export interface SessionReviewResponse {
  review: SessionReview | null;
}

export interface ScreeningResponse {
  screeningId: string;
  resultado: ScreeningResult;
  acolhimento?: {
    mensagem: string;
    canais: readonly { nome: string; contato: string; detalhe: string }[];
  };
}

export interface PendingCrpEntry {
  user_id: string;
  crp_numero: string;
  crp_regiao: string;
  crp_status: CrpStatus;
  users: { full_name: string; email: string; created_at: string } | null;
}

export interface PendingCrpResponse {
  items: PendingCrpEntry[];
}

export interface CrpActionResponse {
  user_id: string;
  crp_status: CrpStatus;
}

/** Item de histórico do painel — nickname do paciente apenas (LGPD). */
export interface ProSessionHistoryItem {
  id: string;
  status: string;
  createdAt: string;
  startedAt: string | null;
  endedAt: string | null;
  segundosCobrados: number;
  valorPsicologoCentavos: number | null;
  patientNickname: string | null;
}

export interface ProDashboardKpis {
  consultasEnded: number;
  segundosTotais: number;
  ganhosCentavos: number;
  mediaAvaliacao: number | null;
  totalAvaliacoes: number;
}

export interface ProDashboardProfile {
  fullName: string | null;
  publicNickname: string | null;
  crpNumero: string;
  crpRegiao: string;
  crpStatus: CrpStatus;
  bio: string | null;
  abordagens: string[] | null;
  especialidades: string[] | null;
  fotoUrl: string | null;
  precoPorMinutoCentavos: number;
  disponibilidade: Availability;
}

/** GET /pro/dashboard */
export interface ProDashboardResponse {
  kpis: ProDashboardKpis;
  recentSessions: ProSessionHistoryItem[];
  avaliacao: AvaliacaoSummary;
  profile: ProDashboardProfile;
}

/** GET /pro/sessions */
export interface ProSessionsResponse {
  items: ProSessionHistoryItem[];
  limit: number;
}

/** Item de histórico do paciente — nome do psicólogo + CRP. */
export interface PatientSessionHistoryItem {
  id: string;
  status: string;
  createdAt: string;
  startedAt: string | null;
  endedAt: string | null;
  segundosCobrados: number;
  valorTotalCentavos: number | null;
  psychologistName: string | null;
  crpNumero: string | null;
  crpRegiao: string | null;
  psychologistFotoUrl: string | null;
}

export interface PatientDashboardKpis {
  consultasEnded: number;
  segundosTotais: number;
  gastoTotalCentavos: number;
  saldoCentavos: number;
  saldoReservadoCentavos: number;
}

export interface PatientDashboardReview {
  nota: number;
  comentario: string | null;
  criadoEm: string;
  publicado: boolean;
  psychologistName: string | null;
}

export interface PatientDashboardProfile {
  fullName: string | null;
  publicNickname: string | null;
  cidade: string | null;
  dataNascimento: string;
  fotoUrl: string | null;
  bio: string | null;
  mostrarNomeReal: boolean;
  cameraLigadaPadrao: boolean;
}

/** GET /me/dashboard */
export interface PatientDashboardResponse {
  kpis: PatientDashboardKpis;
  recentSessions: PatientSessionHistoryItem[];
  reviews: PatientDashboardReview[];
  profile: PatientDashboardProfile;
}

/** GET /me/sessions */
export interface PatientSessionsResponse {
  items: PatientSessionHistoryItem[];
  limit: number;
}
