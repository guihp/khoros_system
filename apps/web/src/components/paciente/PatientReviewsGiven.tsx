import { formatReviewDate, starsText } from "@/lib/format-rating";
import type { PatientDashboardReview } from "@/lib/api-types";

interface PatientReviewsGivenProps {
  reviews: PatientDashboardReview[];
  loading?: boolean;
}

export function PatientReviewsGiven({ reviews, loading }: PatientReviewsGivenProps) {
  return (
    <section className="rounded-card border border-calm-200 bg-white/90 p-5 sm:p-6">
      <h2 className="font-display text-xl tracking-tight text-calm-900">Suas avaliações</h2>
      <p className="mt-1 text-sm text-calm-600">Notas que você deixou após as consultas.</p>

      {loading ? (
        <ul className="mt-4 space-y-3" aria-busy="true">
          {Array.from({ length: 2 }).map((_, i) => (
            <li key={i} className="h-20 animate-pulse rounded-lg bg-calm-100/80" />
          ))}
        </ul>
      ) : reviews.length === 0 ? (
        <div className="mt-5 rounded-lg border border-dashed border-calm-200 bg-calm-50/60 px-4 py-8 text-center">
          <p className="text-sm font-medium text-calm-800">Ainda sem avaliações</p>
          <p className="mt-1 text-sm text-calm-600">
            Depois de uma consulta, você pode avaliar o profissional. O feedback aparece aqui.
          </p>
        </div>
      ) : (
        <ul className="mt-4 space-y-3">
          {reviews.map((item, idx) => (
            <li
              key={`${item.criadoEm}-${idx}`}
              className="rounded-lg border border-calm-100 bg-calm-50/50 p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-brand-600" aria-hidden>
                  {starsText(item.nota)}
                </span>
                <span className="text-xs text-calm-600">{formatReviewDate(item.criadoEm)}</span>
              </div>
              <p className="mt-1.5 text-sm font-medium text-calm-900">
                {item.psychologistName?.trim() || "Psicólogo"}
                {!item.publicado ? (
                  <span className="ml-2 text-xs font-normal text-calm-500">(não publicada)</span>
                ) : null}
              </p>
              {item.comentario ? (
                <p className="mt-2 text-sm leading-relaxed text-calm-700">{item.comentario}</p>
              ) : (
                <p className="mt-2 text-sm italic text-calm-400">Sem comentário</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
