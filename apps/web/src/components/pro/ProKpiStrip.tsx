import { formatBRL } from "@khoros/shared";
import { formatRatingValue } from "@/lib/format-rating";
import type { ProDashboardKpis } from "@/lib/api-types";
import { formatMinutesFromSeconds } from "./format-pro";

interface ProKpiStripProps {
  kpis: ProDashboardKpis | null;
  loading?: boolean;
}

function KpiCell({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="min-w-0 rounded-card border border-calm-200/80 bg-white/80 px-4 py-4 sm:px-5">
      <p className="text-xs font-medium uppercase tracking-wide text-calm-600">{label}</p>
      <p className="mt-1.5 font-display text-2xl tracking-tight text-calm-900 tabular-nums">{value}</p>
      {hint ? <p className="mt-1 text-xs text-calm-600">{hint}</p> : null}
    </div>
  );
}

export function ProKpiStrip({ kpis, loading }: ProKpiStripProps) {
  if (loading && !kpis) {
    return (
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4" aria-busy="true">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-[5.5rem] animate-pulse rounded-card border border-calm-200/60 bg-calm-100/80"
          />
        ))}
      </div>
    );
  }

  const consultas = kpis?.consultasEnded ?? 0;
  const minutos = formatMinutesFromSeconds(kpis?.segundosTotais ?? 0);
  const ganhos = formatBRL(kpis?.ganhosCentavos ?? 0);
  const media = kpis?.mediaAvaliacao;
  const totalAvaliacoes = kpis?.totalAvaliacoes ?? 0;

  return (
    <section aria-label="Indicadores">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCell
          label="Consultas"
          value={consultas.toLocaleString("pt-BR")}
          hint={consultas === 1 ? "realizada" : "realizadas"}
        />
        <KpiCell label="Minutos" value={minutos} hint="atendidos" />
        <KpiCell label="Ganhos" value={ganhos} hint="consultas encerradas" />
        <KpiCell
          label="Avaliação"
          value={media != null && totalAvaliacoes > 0 ? formatRatingValue(media) : "—"}
          hint={
            totalAvaliacoes > 0
              ? `${totalAvaliacoes} ${totalAvaliacoes === 1 ? "avaliação" : "avaliações"}`
              : "ainda sem notas"
          }
        />
      </div>
    </section>
  );
}
