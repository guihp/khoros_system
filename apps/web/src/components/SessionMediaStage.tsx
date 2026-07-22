"use client";

import { formatBRL } from "@khoros/shared";
import type { MediaErrorInfo } from "@/lib/use-session-room";

function formatDuration(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function CameraOffIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6" aria-hidden>
      <path
        d="M3 7.5a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-9Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="m14 10 4.5-2.7A1 1 0 0 1 20 8.15v7.7a1 1 0 0 1-1.5.87L14 14" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M2 2l20 20" strokeLinecap="round" />
    </svg>
  );
}

/** Card compacto de aviso de mídia sobre o palco de vídeo — nunca empurra o layout. */
function MediaErrorCard({
  mediaError,
  onRetry,
}: {
  mediaError: MediaErrorInfo;
  onRetry: () => void;
}) {
  const isInsecure = mediaError.type === "insecure-context";
  return (
    <div className="absolute inset-x-3 top-14 z-20 sm:inset-x-auto sm:left-1/2 sm:top-16 sm:w-[26rem] sm:-translate-x-1/2">
      <div className="rounded-card border border-warn-100 bg-white/95 p-4 text-center shadow-lg backdrop-blur">
        <p className="text-sm font-medium text-calm-900">
          {isInsecure ? "Câmera e microfone indisponíveis" : "Sem acesso à câmera/microfone"}
        </p>
        <p className="mt-1.5 text-xs leading-relaxed text-calm-600">{mediaError.message}</p>
        {!isInsecure && (
          <button
            type="button"
            onClick={onRetry}
            className="mt-3 rounded-full bg-brand-600 px-5 py-2 text-xs font-medium text-white hover:bg-brand-700"
          >
            Tentar novamente
          </button>
        )}
      </div>
    </div>
  );
}

export function SessionMediaStage({
  connected,
  suspended,
  wsConnected,
  remoteVideoRef,
  localVideoRef,
  camEnabled,
  mediaError,
  onRetryMedia,
  paidSeconds,
  accruedCents,
  warning,
}: {
  connected: boolean;
  suspended: boolean;
  /** false enquanto o canal de heartbeat está caído/reconectando — o cronômetro fica "pausado" na UI em vez de congelar em silêncio. */
  wsConnected: boolean;
  remoteVideoRef: (el: HTMLVideoElement | null) => void;
  localVideoRef: (el: HTMLVideoElement | null) => void;
  camEnabled: boolean;
  mediaError: MediaErrorInfo | null;
  onRetryMedia: () => void;
  paidSeconds: number;
  accruedCents: number;
  warning: string | null;
}) {
  const showLocalPlaceholder = !camEnabled || Boolean(mediaError);
  const reconnecting = suspended || !wsConnected;
  const statusLabel = !wsConnected ? "Reconectando…" : suspended ? "Reconectando…" : "Consulta em andamento";

  return (
    <div className="relative mx-3 mt-3 flex-1 overflow-hidden rounded-card bg-calm-900 sm:mx-4 sm:mt-4">
      <video ref={remoteVideoRef} autoPlay playsInline className="h-full w-full object-cover" />

      {!connected && (
        <div className="absolute inset-0 flex items-center justify-center px-6 text-center text-sm text-calm-100">
          Aguardando conexão de vídeo…
        </div>
      )}

      {connected && reconnecting && (
        <div className="absolute inset-0 flex items-center justify-center bg-calm-900/70 px-6 text-center text-sm text-calm-50">
          {suspended
            ? "Reconectando… sua consulta está pausada e não está sendo cobrada."
            : "Conexão instável — tentando reconectar. O cronômetro está pausado até voltar."}
        </div>
      )}

      {/* Barra superior: status calmo + cronômetro/custo, discretos sobre o vídeo. */}
      <div className="absolute inset-x-3 top-3 z-10 flex items-center justify-between gap-2 sm:inset-x-4">
        <span className="rounded-full bg-black/40 px-3 py-1 text-xs text-calm-50 backdrop-blur">
          {statusLabel}
        </span>
        <span className="rounded-full bg-black/40 px-3 py-1 text-xs text-calm-50 backdrop-blur">
          {formatDuration(paidSeconds)} · {formatBRL(accruedCents)}
        </span>
      </div>

      {mediaError && <MediaErrorCard mediaError={mediaError} onRetry={onRetryMedia} />}

      {/* PIP local — canto inferior direito, com placeholder quando não há vídeo local. */}
      <div className="absolute bottom-3 right-3 h-32 w-24 overflow-hidden rounded-md border border-calm-100/40 shadow-lg sm:h-40 sm:w-28">
        <video
          ref={localVideoRef}
          autoPlay
          playsInline
          muted
          className={`h-full w-full object-cover ${showLocalPlaceholder ? "hidden" : ""}`}
        />
        {showLocalPlaceholder && (
          <div className="flex h-full w-full flex-col items-center justify-center gap-1.5 bg-calm-800 text-calm-100">
            <CameraOffIcon />
            <span className="px-1 text-center text-[0.65rem] leading-tight text-calm-200">
              {mediaError ? "Sem permissão" : "Câmera off"}
            </span>
          </div>
        )}
      </div>

      {/* Toast fino de aviso de saldo — sobre o vídeo, ancorado à esquerda para não brigar com o PIP, nunca empurra o palco. */}
      {warning && (
        <div className="absolute bottom-3 left-3 z-10 max-w-[calc(100%-7.5rem)] sm:left-4 sm:max-w-[calc(100%-9rem)]">
          <div
            role="status"
            className="rounded-full border border-warn-100 bg-warn-100/95 px-4 py-1.5 text-left text-xs font-medium text-warn-700 shadow-sm backdrop-blur"
          >
            {warning}
          </div>
        </div>
      )}
    </div>
  );
}
