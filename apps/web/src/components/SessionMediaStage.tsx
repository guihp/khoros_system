"use client";

import { formatBRL } from "@khoros/shared";
import type { MediaErrorInfo } from "@/lib/use-session-room";

function formatDuration(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function CameraOffIcon({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden>
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

function initialsFromLabel(label: string): string {
  const parts = label.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
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
      <div className="rounded-2xl border border-white/10 bg-black/80 p-4 text-center shadow-lg backdrop-blur">
        <p className="text-sm font-medium text-white">
          {isInsecure ? "Câmera e microfone indisponíveis" : "Sem acesso à câmera/microfone"}
        </p>
        <p className="mt-1.5 text-xs leading-relaxed text-white/70">{mediaError.message}</p>
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

function VideoPlaceholder({
  label,
  initials,
  hint,
}: {
  label: string;
  initials: string;
  hint?: string;
}) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#1a222c] px-6 text-center">
      <span
        className="flex h-20 w-20 items-center justify-center rounded-full bg-[#2a3542] text-2xl font-semibold tracking-wide text-white/90 sm:h-24 sm:w-24 sm:text-3xl"
        aria-hidden
      >
        {initials}
      </span>
      <p className="text-sm font-medium text-white/90">{label}</p>
      {hint && <p className="text-xs text-white/55">{hint}</p>}
    </div>
  );
}

/**
 * Palco estilo Meet: fundo escuro, tile 16:9 centrado (remoto ou local),
 * PIP local quando há remoto, placeholders com iniciais — sem faixa cinza morta.
 */
export function SessionMediaStage({
  connected,
  suspended,
  wsConnected,
  remoteVideoRef,
  localVideoRef,
  camEnabled,
  remoteVideoActive,
  remoteLabel = "Profissional",
  localLabel = "Você",
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
  remoteVideoActive: boolean;
  remoteLabel?: string;
  localLabel?: string;
  mediaError: MediaErrorInfo | null;
  onRetryMedia: () => void;
  paidSeconds: number;
  accruedCents: number;
  warning: string | null;
}) {
  const showLocalPlaceholder = !camEnabled || Boolean(mediaError);
  const reconnecting = suspended || !wsConnected;
  const statusLabel = !wsConnected ? "Reconectando…" : suspended ? "Reconectando…" : "Consulta em andamento";
  const localInitials = initialsFromLabel(localLabel);
  /** Sem remoto: local ocupa o tile principal (Meet). */
  const localIsMain = !remoteVideoActive;
  const localMainHint = !connected
    ? "Aguardando vídeo…"
    : mediaError
      ? "Sem permissão de câmera"
      : !camEnabled
        ? "Câmera desligada"
        : "Aguardando vídeo…";
  const showLocalMainPlaceholder = showLocalPlaceholder || !connected;

  return (
    <div className="relative flex min-h-0 flex-1 flex-col bg-[#0f1419]">
      {/* Barra superior: status + cronômetro/custo */}
      <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between gap-2 px-3 pb-2 pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-5">
        <span className="rounded-full bg-black/50 px-3 py-1 text-xs text-white/90 backdrop-blur">
          {statusLabel}
        </span>
        <span className="rounded-full bg-black/50 px-3 py-1 text-xs text-white/90 backdrop-blur">
          {formatDuration(paidSeconds)} · {formatBRL(accruedCents)}
        </span>
      </div>

      {/* Área do tile — preenche o espaço útil acima do dock */}
      <div className="flex min-h-0 flex-1 items-center justify-center px-3 pb-2 pt-14 sm:px-6 sm:pb-3 sm:pt-16">
        <div className="relative h-full max-h-[min(100%,40rem)] w-full max-w-[1100px] overflow-hidden rounded-2xl bg-[#1a222c] shadow-2xl shadow-black/40 aspect-[9/16] sm:aspect-video sm:h-auto sm:max-h-none">
          {/* Tile principal: remoto se presente, senão local */}
          {localIsMain ? (
            <>
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className={`h-full w-full object-cover ${showLocalMainPlaceholder ? "hidden" : ""}`}
              />
              {/* remote ref ainda montado (oculto) para attach quando chegar */}
              <video ref={remoteVideoRef} autoPlay playsInline className="pointer-events-none absolute h-0 w-0 opacity-0" />
              {showLocalMainPlaceholder && (
                <VideoPlaceholder label={localLabel} initials={localInitials} hint={localMainHint} />
              )}
              {!showLocalMainPlaceholder && (
                <span className="absolute bottom-3 left-3 rounded-md bg-black/50 px-2 py-0.5 text-xs text-white/90 backdrop-blur">
                  {localLabel}
                </span>
              )}
              {connected && !remoteVideoActive && camEnabled && !mediaError && (
                <p className="absolute bottom-3 left-1/2 z-10 -translate-x-1/2 rounded-full bg-black/50 px-3 py-1 text-xs text-white/75 backdrop-blur">
                  Aguardando o outro lado…
                </p>
              )}
            </>
          ) : (
            <>
              <video ref={remoteVideoRef} autoPlay playsInline className="h-full w-full object-cover" />
              <span className="absolute bottom-3 left-3 rounded-md bg-black/50 px-2 py-0.5 text-xs text-white/90 backdrop-blur">
                {remoteLabel}
              </span>

              {/* PIP local — canto inferior direito */}
              <div className="absolute bottom-3 right-3 z-10 h-[5.5rem] w-[4.25rem] overflow-hidden rounded-xl border border-white/20 shadow-lg sm:bottom-4 sm:right-4 sm:h-[7.5rem] sm:w-[11.25rem]">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`h-full w-full object-cover ${showLocalPlaceholder ? "hidden" : ""}`}
                />
                {showLocalPlaceholder && (
                  <div className="flex h-full w-full flex-col items-center justify-center gap-1 bg-[#2a3542] text-white/80">
                    <CameraOffIcon className="h-5 w-5" />
                    <span className="px-1 text-center text-[0.6rem] leading-tight">
                      {mediaError ? "Sem permissão" : "Câmera off"}
                    </span>
                  </div>
                )}
                <span className="absolute bottom-1 left-1 rounded bg-black/55 px-1.5 py-0.5 text-[0.6rem] text-white/90">
                  {localLabel}
                </span>
              </div>
            </>
          )}

          {connected && reconnecting && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/70 px-6 text-center text-sm text-white">
              {suspended
                ? "Reconectando… sua consulta está pausada e não está sendo cobrada."
                : "Conexão instável — tentando reconectar. O cronômetro está pausado até voltar."}
            </div>
          )}

          {mediaError && <MediaErrorCard mediaError={mediaError} onRetry={onRetryMedia} />}

          {warning && (
            <div
              className={`absolute z-10 max-w-[min(18rem,calc(100%-6rem))] sm:max-w-sm ${
                remoteVideoActive ? "bottom-3 left-3 sm:bottom-4" : "bottom-12 left-3 sm:bottom-4"
              }`}
            >
              <div
                role="status"
                className="rounded-full border border-amber-200/30 bg-amber-100/95 px-4 py-1.5 text-left text-xs font-medium text-amber-900 shadow-sm backdrop-blur"
              >
                {warning}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
