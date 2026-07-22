"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatBRL } from "@khoros/shared";
import { useAuth } from "@/lib/auth-context";
import { fetchApi, ApiError } from "@/lib/api";
import { roleHomePath } from "@/lib/complete-registration";
import { formatRatingValue } from "@/lib/format-rating";
import type { ConsentStatusResponse, PsychologistListItem, PsychologistsListResponse } from "@/lib/api-types";
import {
  PacienteFilters,
  type PacienteFilterValues,
} from "@/components/paciente/PacienteFilters";

const BIO_CARD_MAX = 120;

const DEFAULT_FILTERS: PacienteFilterValues = {
  q: "",
  especialidade: "",
  abordagem: "",
  precoMin: "",
  precoMax: "",
  minNota: "",
  disponivel: true,
};

function initials(name: string | undefined | null): string {
  if (!name?.trim()) return "?";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ""}${parts[parts.length - 1]![0] ?? ""}`.toUpperCase();
}

function truncateBio(bio: string | null | undefined): string | null {
  if (!bio?.trim()) return null;
  const t = bio.trim();
  if (t.length <= BIO_CARD_MAX) return t;
  return `${t.slice(0, BIO_CARD_MAX - 1).trimEnd()}…`;
}

/** Converte string de reais (ex. "2,5" / "2.5") em centavos; null se vazio/inválido. */
function reaisToCents(raw: string): number | null {
  const trimmed = raw.trim().replace(",", ".");
  if (!trimmed) return null;
  const n = Number(trimmed);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n * 100);
}

function buildPsychologistsQuery(filters: PacienteFilterValues): string {
  const params = new URLSearchParams();
  const q = filters.q.trim();
  if (q) params.set("q", q);
  if (filters.especialidade) params.set("especialidade", filters.especialidade);
  if (filters.abordagem) params.set("abordagem", filters.abordagem);
  const precoMin = reaisToCents(filters.precoMin);
  if (precoMin !== null) params.set("precoMin", String(precoMin));
  const precoMax = reaisToCents(filters.precoMax);
  if (precoMax !== null && precoMax > 0) params.set("precoMax", String(precoMax));
  if (filters.minNota) params.set("minNota", filters.minNota);
  params.set("disponivel", filters.disponivel ? "true" : "false");
  const qs = params.toString();
  return qs ? `/psychologists?${qs}` : "/psychologists";
}

function filtersAreActive(filters: PacienteFilterValues): boolean {
  return Boolean(
    filters.q.trim() ||
      filters.especialidade ||
      filters.abordagem ||
      filters.precoMin.trim() ||
      filters.precoMax.trim() ||
      filters.minNota ||
      !filters.disponivel,
  );
}

/**
 * Cardápio do paciente: busca e filtros em GET /psychologists.
 * Consentimentos + Falar agora permanecem no fluxo existente.
 */
export default function PacientePage() {
  const { session, me, loading: authLoading } = useAuth();
  const router = useRouter();
  const [psychologists, setPsychologists] = useState<PsychologistListItem[] | null>(null);
  const [consentStatus, setConsentStatus] = useState<ConsentStatusResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [startingId, setStartingId] = useState<string | null>(null);
  const [filters, setFilters] = useState<PacienteFilterValues>(DEFAULT_FILTERS);
  const [debouncedFilters, setDebouncedFilters] = useState<PacienteFilterValues>(DEFAULT_FILTERS);

  const needsRegistration = Boolean(session && me && me.registered === false);
  const hasActiveFilters = useMemo(() => filtersAreActive(debouncedFilters), [debouncedFilters]);

  useEffect(() => {
    if (authLoading) return;
    if (me?.registered && me.role !== "PATIENT") {
      router.replace(roleHomePath(me.role));
    }
  }, [authLoading, me, router]);

  // Debounce de campos de texto; selects/chip já vão no mesmo estado.
  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedFilters(filters), 300);
    return () => window.clearTimeout(t);
  }, [filters]);

  const loadPsychologists = useCallback(async () => {
    if (authLoading) return;
    if (!session) {
      setPsychologists([]);
      setError(null);
      return;
    }
    if (needsRegistration) {
      setPsychologists([]);
      setError(null);
      return;
    }

    setPsychologists(null);
    try {
      const data = await fetchApi<PsychologistsListResponse>(buildPsychologistsQuery(debouncedFilters), {
        token: session.access_token,
      });
      setPsychologists(data.items);
      setError(null);
    } catch (err) {
      const code = err instanceof ApiError ? err.message : null;
      if (code === "NOT_REGISTERED") {
        setError(null);
        setPsychologists([]);
        return;
      }
      setError(err instanceof ApiError ? err.message : "Não foi possível carregar os psicólogos.");
      setPsychologists([]);
    }
  }, [session, authLoading, needsRegistration, debouncedFilters]);

  useEffect(() => {
    void loadPsychologists();
  }, [loadPsychologists]);

  useEffect(() => {
    if (!session?.access_token || needsRegistration) {
      setConsentStatus(null);
      return;
    }
    fetchApi<ConsentStatusResponse>("/consents/status", { token: session.access_token })
      .then(setConsentStatus)
      .catch(() => setConsentStatus(null));
  }, [session, needsRegistration]);

  function hasRequiredConsents(): boolean {
    if (!consentStatus) return false;
    return consentStatus.termoOk && consentStatus.lgpdOk && consentStatus.responsavelLegalOk;
  }

  function handleFilterChange(patch: Partial<PacienteFilterValues>) {
    setFilters((prev) => ({ ...prev, ...patch }));
  }

  function handleClearFilters() {
    setFilters(DEFAULT_FILTERS);
    setDebouncedFilters(DEFAULT_FILTERS);
  }

  function handleFalarAgora(e: React.MouseEvent, psyId: string) {
    e.preventDefault();
    e.stopPropagation();
    if (!session) {
      router.push("/entrar");
      return;
    }
    if (needsRegistration) {
      router.push("/cadastro");
      return;
    }
    setStartingId(psyId);
    if (!hasRequiredConsents()) {
      router.push("/consentimentos");
      return;
    }
    router.push(`/triagem?psy=${psyId}`);
  }

  if (authLoading) {
    return <main className="mx-auto max-w-5xl px-4 py-10 text-calm-600">Carregando…</main>;
  }

  if (needsRegistration) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-10 text-center">
        <h1 className="font-display text-2xl tracking-tight text-calm-900">Complete seu cadastro</h1>
        <p className="mt-3 text-sm text-calm-600">
          Você já tem login, mas ainda falta criar seu perfil na KHOROS (paciente ou psicólogo)
          para ver profissionais e iniciar uma consulta.
        </p>
        <Link
          href="/cadastro"
          className="mt-8 inline-block rounded-full bg-brand-600 px-6 py-3 text-sm font-medium text-white hover:bg-brand-700"
        >
          Completar cadastro
        </Link>
      </main>
    );
  }

  if (!session) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-10 text-center">
        <h1 className="font-display text-2xl tracking-tight text-calm-900">Encontrar psicólogo</h1>
        <p className="mt-3 text-sm text-calm-600">Entre na sua conta para ver quem está disponível agora.</p>
        <Link href="/entrar" className="mt-8 inline-block text-brand-700 underline">
          Entrar
        </Link>
      </main>
    );
  }

  const resultCount = psychologists?.length ?? 0;
  const consentsMissing = consentStatus !== null && !hasRequiredConsents();
  const counterLabel = debouncedFilters.disponivel
    ? `${resultCount} ${resultCount === 1 ? "disponível" : "disponíveis"}`
    : `${resultCount} ${resultCount === 1 ? "profissional" : "profissionais"}`;

  return (
    <main className="atmosphere-panel min-h-[calc(100vh-4rem)]">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:py-10">
        <header className="mb-6 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm text-calm-600">Consulta sob demanda · pago por minuto</p>
            <h1 className="font-display text-3xl tracking-tight text-calm-900 sm:text-4xl">
              Encontrar psicólogo
            </h1>
            <p className="mt-2 max-w-xl text-sm text-calm-600">
              Todos com inscrição ativa no CRP, verificada pela KHOROS. Filtre por especialidade,
              abordagem, preço ou nota.
            </p>
          </div>
          <span
            className={`inline-flex w-fit shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium ${
              debouncedFilters.disponivel
                ? "bg-sage-100/60 text-sage-600"
                : "bg-calm-100 text-calm-600"
            }`}
          >
            {debouncedFilters.disponivel && <span aria-hidden>●</span>}
            {psychologists === null ? "…" : counterLabel}
          </span>
        </header>

        <PacienteFilters
          values={filters}
          onChange={handleFilterChange}
          onClear={handleClearFilters}
          hasActiveFilters={filtersAreActive(filters)}
        />

        {consentsMissing && (
          <div className="mt-5 rounded-card border border-warn-100 bg-warn-100/40 p-4 text-sm text-warn-700">
            Antes da sua primeira consulta, pedimos alguns consentimentos.{" "}
            <Link href="/consentimentos" className="underline hover:text-warn-700/80">
              Revisar agora
            </Link>
            .
          </div>
        )}

        {error && <p className="mt-5 text-sm text-red-700">{error}</p>}

        {psychologists === null ? (
          <p className="mt-8 text-sm text-calm-600">Carregando…</p>
        ) : psychologists.length === 0 && !error ? (
          <div className="mt-8 rounded-card border border-calm-200 bg-white p-8 text-center">
            {hasActiveFilters ? (
              <>
                <p className="font-display text-lg tracking-tight text-calm-900">
                  Nenhum profissional com esses filtros
                </p>
                <p className="mt-2 text-sm text-calm-600">
                  Tente ampliar a busca: remova um filtro, ajuste a faixa de preço ou desative “Só
                  disponíveis agora”.
                </p>
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="mt-5 rounded-full bg-brand-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-700"
                >
                  Limpar filtros
                </button>
              </>
            ) : (
              <>
                <p className="font-display text-lg tracking-tight text-calm-900">
                  Ninguém disponível agora
                </p>
                <p className="mt-2 text-sm text-calm-600">
                  Nossos psicólogos entram e saem de disponibilidade ao longo do dia. Tente novamente
                  em alguns minutos, ou desative o filtro “Só disponíveis agora” para ver o cardápio
                  completo.
                </p>
                <button
                  type="button"
                  onClick={() => handleFilterChange({ disponivel: false })}
                  className="mt-5 text-sm font-medium text-brand-700 underline hover:text-brand-800"
                >
                  Ver todos os verificados
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4">
            {psychologists.map((p) => {
              const name = p.users?.full_name ?? "Psicólogo";
              const tags = [...(p.abordagens ?? []), ...(p.especialidades ?? [])].slice(0, 3);
              const bioPreview = truncateBio(p.bio);
              const isAvailable = p.disponibilidade === "AVAILABLE";

              return (
                <article
                  key={p.user_id}
                  className="group relative flex flex-col overflow-hidden rounded-card border border-calm-200 bg-white transition-shadow hover:border-calm-300 hover:shadow-md"
                >
                  <Link
                    href={`/profissional/${p.user_id}`}
                    className="flex flex-1 flex-col outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2"
                  >
                    <div className="relative aspect-[4/3] w-full overflow-hidden bg-brand-50">
                      {p.foto_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={p.foto_url}
                          alt=""
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/80 text-lg font-semibold text-brand-700 shadow-sm ring-1 ring-brand-100 md:h-20 md:w-20 md:text-xl">
                            {initials(name)}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-1 flex-col p-3 pb-0 md:p-4 md:pb-0">
                      <p className="line-clamp-2 text-sm font-semibold leading-snug text-calm-900 md:text-base">
                        {name}
                      </p>
                      <p className="mt-1 text-sm font-medium text-calm-800">
                        {formatBRL(p.preco_por_minuto_centavos)}
                        <span className="font-normal text-calm-600">/min</span>
                      </p>
                      {isAvailable ? (
                        <p className="mt-1 text-xs font-medium text-sage-600">● Disponível</p>
                      ) : (
                        <p className="mt-1 text-xs font-medium text-calm-400">Indisponível agora</p>
                      )}
                      {(p.totalAvaliacoes ?? 0) > 0 ? (
                        <p className="mt-1 text-xs text-calm-600">
                          <span className="text-brand-600" aria-hidden>
                            ★
                          </span>{" "}
                          {formatRatingValue(p.mediaAvaliacao ?? 0)} · {p.consultasRealizadas}{" "}
                          {p.consultasRealizadas === 1 ? "consulta" : "consultas"}
                        </p>
                      ) : (p.consultasRealizadas ?? 0) > 0 ? (
                        <p className="mt-1 text-xs text-calm-600">
                          {p.consultasRealizadas}{" "}
                          {p.consultasRealizadas === 1 ? "consulta" : "consultas"}
                        </p>
                      ) : null}

                      {tags.length > 0 && (
                        <p className="mt-2 line-clamp-1 text-xs text-calm-600">{tags.join(" · ")}</p>
                      )}
                      {bioPreview && (
                        <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-calm-600 md:text-sm">
                          {bioPreview}
                        </p>
                      )}
                    </div>
                  </Link>

                  <div className="mt-auto p-3 pt-3 md:p-4">
                    {isAvailable ? (
                      <button
                        type="button"
                        disabled={startingId === p.user_id}
                        onClick={(e) => handleFalarAgora(e, p.user_id)}
                        className="w-full rounded-full bg-brand-600 px-3 py-2 text-xs font-medium text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60 md:py-2.5 md:text-sm"
                      >
                        {startingId === p.user_id ? "Abrindo…" : "Falar agora"}
                      </button>
                    ) : (
                      <Link
                        href={`/profissional/${p.user_id}`}
                        className="flex w-full items-center justify-center rounded-full border border-calm-200 bg-calm-50 px-3 py-2 text-xs font-medium text-calm-700 hover:border-calm-300 hover:bg-white md:py-2.5 md:text-sm"
                      >
                        Ver perfil
                      </Link>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
