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

export function SessionRoom({
  sessionId,
  backHref,
}: {
  sessionId: string;
  backHref: string;
}) {
  const room = useSessionRoom(sessionId);
  const router = useRouter();

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

  // Sessão criada, mas o profissional ainda não aceitou: evita mostrar uma
  // sala "fake ativa" com dock completo — só um estado de espera calmo.
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

  return (
    <main className="flex min-h-dvh flex-col">
      <SessionMediaStage
        connected={room.connected}
        suspended={room.status === "SUSPENDED"}
        wsConnected={room.wsConnected}
        remoteVideoRef={room.remoteVideoRef}
        localVideoRef={room.localVideoRef}
        camEnabled={room.camEnabled}
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
    </main>
  );
}
