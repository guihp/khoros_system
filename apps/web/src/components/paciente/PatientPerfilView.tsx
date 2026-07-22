"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchApi, ApiError } from "@/lib/api";
import type {
  PatientDashboardResponse,
  PatientProfileApi,
  PatientSessionHistoryItem,
  PatientSessionsResponse,
} from "@/lib/api-types";
import { PatientKpiStrip } from "./PatientKpiStrip";
import { PatientProfileEditor } from "./PatientProfileEditor";
import { PatientReviewsGiven } from "./PatientReviewsGiven";
import { PatientSessionHistory } from "./PatientSessionHistory";

const HISTORY_PAGE_SIZE = 20;

interface PatientPerfilViewProps {
  token: string;
  email: string;
  fullName: string;
  nickname: string | null;
  profile: PatientProfileApi | null;
  onSaved: () => Promise<void>;
}

export function PatientPerfilView({
  token,
  email,
  fullName,
  nickname,
  profile,
  onSaved,
}: PatientPerfilViewProps) {
  const [dashboard, setDashboard] = useState<PatientDashboardResponse | null>(null);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [sessions, setSessions] = useState<PatientSessionHistoryItem[]>([]);
  const [loadingMore, setLoadingMore] = useState(false);
  const [historyExpanded, setHistoryExpanded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setDashboardLoading(true);

    (async () => {
      try {
        const data = await fetchApi<PatientDashboardResponse>("/me/dashboard", { token });
        if (cancelled) return;
        setDashboard(data);
        setSessions(data.recentSessions);
        setHistoryExpanded(false);
        setError(null);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof ApiError ? err.message : "Não foi possível carregar seu painel.");
      } finally {
        if (!cancelled) setDashboardLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token]);

  async function handleLoadMoreSessions() {
    if (loadingMore) return;
    setLoadingMore(true);
    try {
      const data = await fetchApi<PatientSessionsResponse>(`/me/sessions?limit=${HISTORY_PAGE_SIZE}`, {
        token,
      });
      setSessions(data.items);
      setHistoryExpanded(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível carregar o histórico.");
    } finally {
      setLoadingMore(false);
    }
  }

  async function handleSaved() {
    await onSaved();
    try {
      const data = await fetchApi<PatientDashboardResponse>("/me/dashboard", { token });
      setDashboard(data);
      if (!historyExpanded) {
        setSessions(data.recentSessions);
      }
    } catch {
      // Perfil já foi salvo; dashboard é best-effort.
    }
  }

  const canLoadMore =
    !historyExpanded && (dashboard?.recentSessions.length ?? 0) >= 5;

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-2xl tracking-tight text-calm-900 sm:text-3xl">Seu perfil</h1>
        <p className="mt-1.5 text-sm text-calm-600">{email}</p>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-calm-600">
          Atualize como você aparece na consulta, veja seu histórico e acompanhe o saldo da{" "}
          <Link href="/carteira" className="font-medium text-brand-700 underline hover:text-brand-800">
            carteira
          </Link>
          .
        </p>
      </header>

      {error ? <p className="text-sm text-red-700">{error}</p> : null}

      <PatientKpiStrip kpis={dashboard?.kpis ?? null} loading={dashboardLoading} />

      <PatientProfileEditor
        token={token}
        fullName={fullName}
        nickname={nickname}
        profile={profile}
        onSaved={handleSaved}
      />

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <PatientSessionHistory
            sessions={sessions}
            loading={dashboardLoading}
            canLoadMore={canLoadMore}
            loadingMore={loadingMore}
            onLoadMore={handleLoadMoreSessions}
          />
        </div>
        <div className="lg:col-span-2">
          <PatientReviewsGiven reviews={dashboard?.reviews ?? []} loading={dashboardLoading} />
        </div>
      </div>
    </div>
  );
}
