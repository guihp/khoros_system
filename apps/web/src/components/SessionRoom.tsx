"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { formatBRL } from "@khoros/shared";
import { useSessionRoom } from "@/lib/use-session-room";
import { SessionReviewForm } from "@/components/SessionReviewForm";
import { SessionMediaStage } from "@/components/SessionMediaStage";
import { SessionRoomControls } from "@/components/SessionRoomControls";

const END_REASON_LABEL: Record<string, string> = {
  PATIENT_ENDED: "Encerrada pelo paciente",
  PSY_ENDED: "Encerrada pelo psicólogo",
  NO_BALANCE: "Encerrada por saldo insuficiente",
  TIMEOUT_RECONNECT: "Encerrada por falha de conexão",
  PSY_NO_ANSWER: "O psicólogo não respondeu",
  ADMIN: "Encerrada pela administração",
  ERROR: "Encerrada por um erro técnico",
};

/** Mensagens acolhedoras para quando a consulta nunca chegou a começar. */
const CANCEL_REASON_LABEL: Record<string, string> = {
  PSY_NO_ANSWER: "O profissional não pôde atender agora.",
  PSY_ENDED: "O profissional não pôde atender agora.",
  PATIENT_ENDED: "Chamada cancelada.",
  NO_BALANCE: "Saldo insuficiente para iniciar a consulta.",
  TIMEOUT_RECONNECT: "A chamada foi cancelada por falha de conexão.",
  ADMIN: "A chamada foi cancelada pela administração.",
  ERROR: "A chamada foi interrompida por um erro técnico.",
};

/** Tempo que a mensagem de cancelamento fica visível antes do redirecionamento automático. */
const CANCEL_REDIRECT_MS = 4_000;

function MicIcon({ off }: { off: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5" aria-hidden>
      <rect x="9" y="2.5" width="6" height="11" rx="3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 11a7 7 0 0 0 14 0" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 18v3.2" strokeLinecap="round" />
      {off && <path d="M2.5 2.5l19 19" strokeLinecap="round" />}
    </svg>
  );
}

function CameraIcon({ off }: { off: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5" aria-hidden>
      <path
        d="M3 7.5a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-9Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="m14 10 4.5-2.7A1 1 0 0 1 20 8.15v7.7a1 1 0 0 1-1.5.87L14 14" strokeLinecap="round" strokeLinejoin="round" />
      {off && <path d="M2.5 2.5l19 19" strokeLinecap="round" />}
    </svg>
  );
}

/** Pré-entrada do paciente: preview + toggles + Entrar — só então LiveKit. */
function SessionPreJoinLobby({
  localVideoRef,
  micEnabled,
  camEnabled,
  mediaError,
  joining,
  onToggleMic,
  onToggleCam,
  onJoin,
  onCancel,
}: {
  localVideoRef: (el: HTMLVideoElement | null) => void;
  micEnabled: boolean;
  camEnabled: boolean;
  mediaError: { message: string } | null;
  joining: boolean;
  onToggleMic: () => void;
  onToggleCam: () => void;
  onJoin: () => void;
  onCancel: () => void;
}) {
  return (
    <main className="flex min-h-dvh flex-col bg-[#0f1419] px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))]">
      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center">
        <p className="text-center text-xl font-semibold text-white">Pronto para entrar?</p>
        <p className="mt-2 text-center text-sm text-white/60">
          Escolha se sua câmera e microfone começam ligados. Você pode mudar a qualquer momento na consulta.
        </p>

        <div className="relative mx-auto mt-6 aspect-video w-full max-w-md overflow-hidden rounded-2xl bg-[#1a222c]">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className={`h-full w-full object-cover ${!camEnabled || mediaError ? "hidden" : ""}`}
          />
          {(!camEnabled || mediaError) && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-white/70">
              <CameraIcon off />
              <span className="text-xs">{mediaError ? "Sem permissão de câmera" : "Câmera desligada"}</span>
            </div>
          )}
          <span className="absolute bottom-3 left-3 rounded-md bg-black/50 px-2 py-0.5 text-xs text-white/90">
            Você
          </span>
        </div>

        {mediaError && (
          <p className="mt-3 text-center text-xs text-amber-200/90">{mediaError.message}</p>
        )}

        <div className="mt-6 flex items-center justify-center gap-4">
          <button
            type="button"
            onClick={onToggleMic}
            aria-pressed={!micEnabled}
            aria-label={micEnabled ? "Mutar microfone" : "Ativar microfone"}
            className={`flex h-12 w-12 items-center justify-center rounded-full transition-colors ${
              micEnabled ? "bg-white/15 text-white" : "bg-white text-[#0f1419]"
            }`}
          >
            <MicIcon off={!micEnabled} />
          </button>
          <button
            type="button"
            onClick={onToggleCam}
            aria-pressed={!camEnabled}
            aria-label={camEnabled ? "Ocultar vídeo" : "Ativar vídeo"}
            className={`flex h-12 w-12 items-center justify-center rounded-full transition-colors ${
              camEnabled ? "bg-white/15 text-white" : "bg-white text-[#0f1419]"
            }`}
          >
            <CameraIcon off={!camEnabled} />
          </button>
        </div>

        <button
          type="button"
          onClick={onJoin}
          disabled={joining}
          className="mt-8 w-full rounded-full bg-brand-600 px-6 py-3.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
        >
          {joining ? "Entrando…" : "Entrar na consulta"}
        </button>

        <button
          type="button"
          onClick={onCancel}
          className="mt-3 w-full rounded-full border border-white/15 px-6 py-2.5 text-sm font-medium text-white/80 hover:bg-white/5"
        >
          Cancelar chamada
        </button>

        <p className="mt-4 text-center text-xs text-white/45">
          Precisa de apoio agora?{" "}
          <Link href="/apoio" className="text-brand-300 underline">
            Ver canais
          </Link>
        </p>
      </div>
    </main>
  );
}

export function SessionRoom({
  sessionId,
  backHref,
  requirePreJoin = false,
  remoteLabel,
}: {
  sessionId: string;
  backHref: string;
  /** Paciente: lobby antes de conectar LiveKit. Psicólogo: false (entra direto). */
  requirePreJoin?: boolean;
  remoteLabel?: string;
}) {
  const room = useSessionRoom(sessionId, { requirePreJoin });
  const router = useRouter();
  const resolvedRemoteLabel = remoteLabel ?? (requirePreJoin ? "Profissional" : "Paciente");

  useEffect(() => {
    if (!room.cancelled) return;
    const timer = setTimeout(() => router.replace(backHref), CANCEL_REDIRECT_MS);
    return () => clearTimeout(timer);
  }, [room.cancelled, router, backHref]);

  if (room.loading) {
    return (
      <main className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-4 text-center">
        <p className="text-calm-600">Conectando à sua consulta…</p>
      </main>
    );
  }

  if (room.error) {
    return (
      <main className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-4 text-center">
        <p className="text-red-700">{room.error}</p>
        <Link href={backHref} className="mt-4 text-brand-700 underline">
          Voltar
        </Link>
      </main>
    );
  }

  if (room.cancelled) {
    return (
      <main className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-4 text-center">
        <div className="w-full rounded-card border border-calm-200 bg-white p-8">
          <p className="text-lg font-semibold text-calm-900">
            {CANCEL_REASON_LABEL[room.cancelled.reason] ?? "A chamada foi cancelada."}
          </p>
          <p className="mt-2 text-sm text-calm-600">
            Nada foi cobrado por esta tentativa. Você pode tentar novamente quando quiser.
          </p>
          <Link
            href={backHref}
            className="mt-6 inline-block rounded-full bg-brand-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-brand-700"
          >
            Voltar
          </Link>
        </div>
      </main>
    );
  }

  if (room.ended) {
    return (
      <main className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-4 text-center">
        <div className="w-full rounded-card border border-calm-200 bg-white p-8">
          <p className="text-lg font-semibold text-calm-900">Consulta encerrada</p>
          <p className="mt-1 text-sm text-calm-600">
            {END_REASON_LABEL[room.ended.reason] ?? room.ended.reason}
          </p>
          <p className="mt-4 text-2xl font-semibold text-calm-900">
            {formatBRL(room.ended.totalCents)}
          </p>
          <p className="mt-1 text-xs text-calm-600">Total desta consulta</p>

          <SessionReviewForm sessionId={sessionId} />

          <Link
            href={backHref}
            className="mt-6 inline-block rounded-full bg-brand-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-brand-700"
          >
            Voltar
          </Link>
        </div>
      </main>
    );
  }

  // Sessão criada, mas o profissional ainda não aceitou.
  if (room.status === "PENDING") {
    return (
      <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center px-4 text-center">
        <div className="w-full rounded-card border border-calm-200 bg-white p-8">
          <span className="mx-auto flex h-3 w-3 animate-pulse-soft rounded-full bg-brand-400" aria-hidden />
          <p className="mt-4 text-lg font-semibold text-calm-900">Aguardando o profissional aceitar…</p>
          <p className="mt-2 text-sm text-calm-600">
            Isso costuma levar poucos segundos. Nada foi cobrado até agora.
          </p>
          <button
            type="button"
            onClick={() => void room.endSession()}
            className="mt-6 rounded-full border border-calm-200 px-6 py-2.5 text-sm font-medium text-calm-800 hover:bg-calm-100"
          >
            Cancelar chamada
          </button>
          <p className="mt-4 text-xs text-calm-600">
            Precisa de apoio agora?{" "}
            <Link href="/apoio" className="text-brand-700 underline">
              Ver canais
            </Link>
          </p>
        </div>
      </main>
    );
  }

  // Paciente: ACTIVE/SUSPENDED mas ainda não entrou — lobby de câmera/mic.
  if (requirePreJoin && !room.hasJoined) {
    return (
      <SessionPreJoinLobby
        localVideoRef={room.localVideoRef}
        micEnabled={room.micEnabled}
        camEnabled={room.camEnabled}
        mediaError={room.mediaError}
        joining={room.joining}
        onToggleMic={room.toggleMic}
        onToggleCam={room.toggleCam}
        onJoin={room.joinSession}
        onCancel={() => void room.endSession()}
      />
    );
  }

  return (
    <main className="h-dvh overflow-hidden bg-[#0f1419]">
      <div className="mx-auto flex h-full w-full max-w-screen-2xl flex-col">
        <SessionMediaStage
          connected={room.connected}
          suspended={room.status === "SUSPENDED"}
          wsConnected={room.wsConnected}
          remoteVideoRef={room.remoteVideoRef}
          localVideoRef={room.localVideoRef}
          camEnabled={room.camEnabled}
          remoteVideoActive={room.remoteVideoActive}
          remoteLabel={resolvedRemoteLabel}
          localLabel="Você"
          mediaError={room.mediaError}
          onRetryMedia={() => void room.retryMedia()}
          paidSeconds={room.paidSeconds}
          accruedCents={room.accruedCents}
          warning={room.warning}
        />

        <SessionRoomControls
          micEnabled={room.micEnabled}
          camEnabled={room.camEnabled}
          onToggleMic={room.toggleMic}
          onToggleCam={room.toggleCam}
          onEndSession={() => void room.endSession()}
        />
      </div>
    </main>
  );
}
