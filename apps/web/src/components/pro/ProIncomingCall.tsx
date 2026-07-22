import { CALL_ACCEPT_TIMEOUT_MS } from "@khoros/shared";

interface ProIncomingCallProps {
  patientNickname: string;
  responding: boolean;
  onAccept: () => void;
  onDecline: () => void;
}

export function ProIncomingCall({
  patientNickname,
  responding,
  onAccept,
  onDecline,
}: ProIncomingCallProps) {
  return (
    <section
      className="rounded-card border border-brand-200 bg-brand-50 p-5 text-center shadow-sm"
      role="alertdialog"
      aria-labelledby="incoming-call-title"
    >
      <p id="incoming-call-title" className="text-sm font-medium text-calm-900">
        Chamada de {patientNickname}
      </p>
      <p className="mt-1 text-xs text-calm-600">
        Responda em até {CALL_ACCEPT_TIMEOUT_MS / 1000} segundos.
      </p>
      <div className="mt-4 flex justify-center gap-3">
        <button
          type="button"
          onClick={onAccept}
          disabled={responding}
          className="rounded-full bg-sage-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-sage-600/90 disabled:opacity-60"
        >
          Aceitar
        </button>
        <button
          type="button"
          onClick={onDecline}
          disabled={responding}
          className="rounded-full border border-calm-200 bg-white px-6 py-2.5 text-sm font-medium text-calm-800 hover:bg-calm-100 disabled:opacity-60"
        >
          Recusar
        </button>
      </div>
    </section>
  );
}
