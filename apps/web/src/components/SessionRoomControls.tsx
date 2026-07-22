"use client";

import Link from "next/link";

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

function PhoneEndIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className="h-5 w-5 rotate-[135deg]"
      aria-hidden
    >
      <path d="M6.62 10.79a15.05 15.05 0 0 0 6.59 6.59l2.2-2.2a1 1 0 0 1 1.01-.24 11.36 11.36 0 0 0 3.55.57 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1C10.16 21 3 13.84 3 5a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1 11.36 11.36 0 0 0 .57 3.55 1 1 0 0 1-.25 1.01l-2.2 2.2Z" />
    </svg>
  );
}

/**
 * Dock inferior fixo da sala: toggles de mic/câmera (>=44px de toque) e o
 * botão de encerrar separado visualmente (vermelho, fora da fileira dos
 * toggles) — para nunca ser tocado por engano no lugar de mutar/ativar vídeo.
 */
export function SessionRoomControls({
  micEnabled,
  camEnabled,
  onToggleMic,
  onToggleCam,
  onEndSession,
}: {
  micEnabled: boolean;
  camEnabled: boolean;
  onToggleMic: () => void;
  onToggleCam: () => void;
  onEndSession: () => void;
}) {
  return (
    <div className="border-t border-calm-200 bg-white px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3">
      <div className="flex items-center justify-center gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onToggleMic}
            aria-pressed={!micEnabled}
            aria-label={micEnabled ? "Mutar microfone" : "Ativar microfone"}
            className={`flex h-12 w-12 flex-col items-center justify-center gap-0.5 rounded-full border text-[0.6rem] font-medium transition-colors ${
              micEnabled
                ? "border-calm-200 text-calm-800 hover:bg-calm-100"
                : "border-warn-700 bg-warn-100 text-warn-700"
            }`}
          >
            <MicIcon off={!micEnabled} />
            <span>{micEnabled ? "Mudo" : "Mic off"}</span>
          </button>
          <button
            type="button"
            onClick={onToggleCam}
            aria-pressed={!camEnabled}
            aria-label={camEnabled ? "Ocultar vídeo" : "Ativar vídeo"}
            className={`flex h-12 w-12 flex-col items-center justify-center gap-0.5 rounded-full border text-[0.6rem] font-medium transition-colors ${
              camEnabled
                ? "border-calm-200 text-calm-800 hover:bg-calm-100"
                : "border-warn-700 bg-warn-100 text-warn-700"
            }`}
          >
            <CameraIcon off={!camEnabled} />
            <span>{camEnabled ? "Vídeo" : "Vídeo off"}</span>
          </button>
        </div>

        <button
          type="button"
          onClick={onEndSession}
          aria-label="Encerrar consulta"
          className="ml-2 flex h-14 w-14 items-center justify-center rounded-full bg-red-600 text-white shadow-md hover:bg-red-700"
        >
          <PhoneEndIcon />
        </button>
      </div>

      <p className="mt-3 text-center text-xs text-calm-600">
        Precisa de apoio agora?{" "}
        <Link href="/apoio" className="text-brand-700 underline">
          Ver canais
        </Link>
      </p>
    </div>
  );
}
