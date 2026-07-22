import { formatBRL } from "@khoros/shared";
import type { ProSessionHistoryItem } from "@/lib/api-types";
import { formatSessionDuration, formatSessionWhen } from "./format-pro";

interface ProSessionHistoryProps {
  sessions: ProSessionHistoryItem[];
  loading?: boolean;
  onLoadMore?: () => void;
  loadingMore?: boolean;
  canLoadMore?: boolean;
}

function statusLabel(status: string): string {
  switch (status) {
    case "ENDED":
      return "Encerrada";
    case "ACTIVE":
      return "Em andamento";
    case "SUSPENDED":
      return "Suspensa";
    case "PENDING":
      return "Pendente";
    default:
      return status;
  }
}

export function ProSessionHistory({
  sessions,
  loading,
  onLoadMore,
  loadingMore,
  canLoadMore,
}: ProSessionHistoryProps) {
  return (
    <section className="rounded-card border border-calm-200 bg-white/90 p-5 sm:p-6">
      <h2 className="font-display text-xl tracking-tight text-calm-900">Consultas recentes</h2>
      <p className="mt-1 text-sm text-calm-600">Histórico com nickname do paciente.</p>

      {loading ? (
        <ul className="mt-4 space-y-3" aria-busy="true">
          {Array.from({ length: 3 }).map((_, i) => (
            <li key={i} className="h-16 animate-pulse rounded-lg bg-calm-100/80" />
          ))}
        </ul>
      ) : sessions.length === 0 ? (
        <div className="mt-5 rounded-lg border border-dashed border-calm-200 bg-calm-50/60 px-4 py-8 text-center">
          <p className="text-sm font-medium text-calm-800">Nenhuma consulta ainda</p>
          <p className="mt-1 text-sm text-calm-600">
            Quando você atender, as sessões encerradas aparecem aqui.
          </p>
        </div>
      ) : (
        <>
          <ul className="mt-4 divide-y divide-calm-100">
            {sessions.map((s) => (
              <li key={s.id} className="flex flex-col gap-1 py-3.5 first:pt-0 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-calm-900">
                    {s.patientNickname?.trim() || "Paciente"}
                  </p>
                  <p className="mt-0.5 text-xs text-calm-600">
                    {formatSessionWhen(s.endedAt ?? s.startedAt ?? s.createdAt)}
                    {" · "}
                    {statusLabel(s.status)}
                  </p>
                </div>
                <div className="flex shrink-0 items-baseline gap-3 text-sm sm:text-right">
                  <span className="tabular-nums text-calm-600">
                    {formatSessionDuration(s.segundosCobrados)}
                  </span>
                  <span className="min-w-[4.5rem] font-medium tabular-nums text-calm-900">
                    {s.valorPsicologoCentavos != null ? formatBRL(s.valorPsicologoCentavos) : "—"}
                  </span>
                </div>
              </li>
            ))}
          </ul>

          {canLoadMore && onLoadMore ? (
            <button
              type="button"
              onClick={onLoadMore}
              disabled={loadingMore}
              className="mt-3 text-sm font-medium text-brand-700 underline hover:text-brand-800 disabled:opacity-60"
            >
              {loadingMore ? "Carregando…" : "Ver mais consultas"}
            </button>
          ) : null}
        </>
      )}
    </section>
  );
}
