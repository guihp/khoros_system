"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Availability, SessionServerEvent } from "@khoros/shared";
import { useAuth } from "@/lib/auth-context";
import { apiWsUrl, fetchApi, ApiError } from "@/lib/api";
import { roleHomePath } from "@/lib/complete-registration";
import type {
  AcceptSessionResponse,
  ProDashboardResponse,
  ProSessionHistoryItem,
  ProSessionsResponse,
  PsychologistProfileApi,
} from "@/lib/api-types";
import { saveSessionCredentials } from "@/lib/session-storage";
import { ProHeader } from "@/components/pro/ProHeader";
import { ProCrpAlert } from "@/components/pro/ProCrpAlert";
import { ProActiveSessionBanner } from "@/components/pro/ProActiveSessionBanner";
import { ProAvailabilityCard } from "@/components/pro/ProAvailabilityCard";
import { ProIncomingCall } from "@/components/pro/ProIncomingCall";
import { ProKpiStrip } from "@/components/pro/ProKpiStrip";
import { ProSessionHistory } from "@/components/pro/ProSessionHistory";
import { ProRecentReviews } from "@/components/pro/ProRecentReviews";

const ACTIVE_SESSION_KEY = "khoros_active_session";
const HISTORY_PAGE_SIZE = 20;

interface IncomingCall {
  sessionId: string;
  patientNickname: string;
  deadline: number;
}

export default function ProPage() {
  const { session, me, loading: authLoading } = useAuth();
  const router = useRouter();
  const profile = me?.registered ? (me.profile as PsychologistProfileApi | undefined) : undefined;

  const [availability, setAvailability] = useState<Availability>(profile?.disponibilidade ?? "OFFLINE");
  const [savingAvailability, setSavingAvailability] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [respondingCall, setRespondingCall] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  const [dashboard, setDashboard] = useState<ProDashboardResponse | null>(null);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [sessions, setSessions] = useState<ProSessionHistoryItem[]>([]);
  const [loadingMore, setLoadingMore] = useState(false);
  const [canLoadMore, setCanLoadMore] = useState(false);

  // Guard leve: este painel é do psicólogo. Paciente/admin vão para a própria home.
  useEffect(() => {
    if (authLoading) return;
    if (me?.registered && me.role !== "PSYCHOLOGIST") {
      router.replace(roleHomePath(me.role));
    }
  }, [authLoading, me, router]);

  useEffect(() => {
    if (profile?.disponibilidade) setAvailability(profile.disponibilidade);
  }, [profile?.disponibilidade]);

  useEffect(() => {
    setActiveSessionId(sessionStorage.getItem(ACTIVE_SESSION_KEY));
  }, []);

  useEffect(() => {
    if (!session?.access_token) return;
    const ws = new WebSocket(`${apiWsUrl("/ws")}?token=${encodeURIComponent(session.access_token)}`);
    wsRef.current = ws;

    ws.onmessage = (evt) => {
      try {
        const msg = JSON.parse(evt.data) as SessionServerEvent;
        if (msg.type === "incoming_call") {
          setIncomingCall({
            sessionId: msg.sessionId,
            patientNickname: msg.patientNickname,
            deadline: Date.now() + msg.timeoutMs,
          });
        }
      } catch {
        // Ignora frames que não sejam eventos de sessão.
      }
    };

    return () => ws.close();
  }, [session]);

  useEffect(() => {
    if (!session?.access_token || authLoading) return;
    if (me?.registered && me.role !== "PSYCHOLOGIST") return;

    let cancelled = false;
    setDashboardLoading(true);

    (async () => {
      try {
        const data = await fetchApi<ProDashboardResponse>("/pro/dashboard", {
          token: session.access_token,
        });
        if (cancelled) return;
        setDashboard(data);
        setSessions(data.recentSessions);
        setCanLoadMore(data.recentSessions.length >= 5);
        if (data.profile.disponibilidade) {
          setAvailability(data.profile.disponibilidade);
        }
        setError(null);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof ApiError ? err.message : "Não foi possível carregar o painel.");
      } finally {
        if (!cancelled) setDashboardLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [session?.access_token, authLoading, me]);

  async function handleToggleAvailability() {
    if (!session?.access_token) return;
    const crpStatus = dashboard?.profile.crpStatus ?? profile?.crp_status;
    if (crpStatus && crpStatus !== "VERIFIED") {
      setError("Sua inscrição no CRP ainda está em verificação pela administração.");
      return;
    }
    const next: Availability = availability === "AVAILABLE" ? "OFFLINE" : "AVAILABLE";
    setSavingAvailability(true);
    setError(null);
    try {
      await fetchApi("/pro/availability", {
        method: "PATCH",
        token: session.access_token,
        body: { disponibilidade: next },
      });
      setAvailability(next);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível atualizar sua disponibilidade.");
    } finally {
      setSavingAvailability(false);
    }
  }

  async function handleAccept() {
    if (!session?.access_token || !incomingCall) return;
    setRespondingCall(true);
    try {
      const result = await fetchApi<AcceptSessionResponse>(`/sessions/${incomingCall.sessionId}/accept`, {
        method: "POST",
        token: session.access_token,
      });
      saveSessionCredentials(incomingCall.sessionId, {
        livekitUrl: result.livekitUrl,
        hbSecret: result.hbSecret,
        psychologistToken: result.psychologistToken,
      });
      sessionStorage.setItem(ACTIVE_SESSION_KEY, incomingCall.sessionId);
      router.push(`/pro/sessao/${incomingCall.sessionId}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível aceitar a chamada.");
      setRespondingCall(false);
    }
  }

  async function handleDecline() {
    if (!session?.access_token || !incomingCall) return;
    setRespondingCall(true);
    try {
      await fetchApi(`/sessions/${incomingCall.sessionId}/decline`, {
        method: "POST",
        token: session.access_token,
      });
    } catch {
      // Já pode ter expirado no servidor; ignoramos.
    } finally {
      setIncomingCall(null);
      setRespondingCall(false);
    }
  }

  async function handleLoadMoreSessions() {
    if (!session?.access_token || loadingMore) return;
    setLoadingMore(true);
    try {
      const data = await fetchApi<ProSessionsResponse>(
        `/pro/sessions?limit=${HISTORY_PAGE_SIZE}`,
        { token: session.access_token },
      );
      setSessions(data.items);
      setCanLoadMore(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível carregar o histórico.");
    } finally {
      setLoadingMore(false);
    }
  }

  if (authLoading) {
    return <main className="mx-auto max-w-3xl px-4 py-16 text-calm-600">Carregando…</main>;
  }

  if (me?.registered && me.role !== "PSYCHOLOGIST") {
    return <main className="mx-auto max-w-3xl px-4 py-16 text-calm-600">Redirecionando…</main>;
  }

  const dashProfile = dashboard?.profile;
  const crpNumero = dashProfile?.crpNumero ?? profile?.crp_numero;
  const crpRegiao = dashProfile?.crpRegiao ?? profile?.crp_regiao;
  const crpStatus = dashProfile?.crpStatus ?? profile?.crp_status;
  const fullName = dashProfile?.fullName ?? (me?.registered ? me.full_name : null);
  const publicId = me?.registered ? me.id : undefined;

  return (
    <main className="atmosphere-panel min-h-[calc(100vh-4rem)]">
      <div className="mx-auto max-w-3xl space-y-6 px-4 py-10 sm:space-y-8 sm:py-12">
        <ProHeader
          fullName={fullName}
          crpNumero={crpNumero}
          crpRegiao={crpRegiao}
          crpStatus={crpStatus}
          publicProfileId={publicId}
        />

        {crpNumero && crpRegiao && crpStatus && crpStatus !== "VERIFIED" ? (
          <ProCrpAlert crpNumero={crpNumero} crpRegiao={crpRegiao} crpStatus={crpStatus} />
        ) : null}

        {activeSessionId ? <ProActiveSessionBanner sessionId={activeSessionId} /> : null}

        <ProAvailabilityCard
          availability={availability}
          saving={savingAvailability}
          onToggle={handleToggleAvailability}
        />

        {error ? <p className="text-sm text-red-700">{error}</p> : null}

        {incomingCall ? (
          <ProIncomingCall
            patientNickname={incomingCall.patientNickname}
            responding={respondingCall}
            onAccept={handleAccept}
            onDecline={handleDecline}
          />
        ) : null}

        <ProKpiStrip kpis={dashboard?.kpis ?? null} loading={dashboardLoading} />

        <div className="grid gap-6 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <ProSessionHistory
              sessions={sessions}
              loading={dashboardLoading}
              canLoadMore={canLoadMore}
              loadingMore={loadingMore}
              onLoadMore={handleLoadMoreSessions}
            />
          </div>
          <div className="lg:col-span-2">
            <ProRecentReviews avaliacao={dashboard?.avaliacao ?? null} loading={dashboardLoading} />
          </div>
        </div>
      </div>
    </main>
  );
}
