import type { Availability } from "@khoros/shared";

interface ProAvailabilityCardProps {
  availability: Availability;
  saving: boolean;
  onToggle: () => void;
}

export function ProAvailabilityCard({ availability, saving, onToggle }: ProAvailabilityCardProps) {
  const isAvailable = availability === "AVAILABLE";

  return (
    <section className="rounded-card border border-calm-200 bg-white/90 p-5 shadow-sm shadow-calm-200/40 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-calm-600">Presença</p>
          <p
            className={`mt-1 font-display text-2xl tracking-tight ${
              isAvailable ? "text-sage-600" : "text-calm-800"
            }`}
          >
            {isAvailable ? "Disponível agora" : "Offline"}
          </p>
          <p className="mt-1 max-w-md text-sm text-calm-600">
            {isAvailable
              ? "Pacientes podem iniciar uma consulta com você a qualquer momento."
              : "Fique disponível quando estiver pronto para atender."}
          </p>
        </div>

        <button
          type="button"
          onClick={onToggle}
          disabled={saving}
          className={`shrink-0 rounded-full px-6 py-2.5 text-sm font-medium transition disabled:opacity-60 ${
            isAvailable
              ? "border border-calm-200 text-calm-800 hover:bg-calm-100"
              : "bg-brand-600 text-white hover:bg-brand-700"
          }`}
        >
          {saving ? "Atualizando…" : isAvailable ? "Ficar offline" : "Ficar disponível"}
        </button>
      </div>
    </section>
  );
}
