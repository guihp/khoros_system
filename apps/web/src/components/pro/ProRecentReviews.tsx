import { formatRatingValue, formatReviewDate, starsText } from "@/lib/format-rating";
import type { AvaliacaoSummary } from "@/lib/api-types";

interface ProRecentReviewsProps {
  avaliacao: AvaliacaoSummary | null;
  loading?: boolean;
}

export function ProRecentReviews({ avaliacao, loading }: ProRecentReviewsProps) {
  const itens = avaliacao?.itens ?? [];
  const media = avaliacao?.media;
  const total = avaliacao?.total ?? 0;

  return (
    <section className="rounded-card border border-calm-200 bg-white/90 p-5 sm:p-6">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="font-display text-xl tracking-tight text-calm-900">Avaliações</h2>
        {total > 0 && media != null ? (
          <p className="text-sm text-calm-600">
            <span className="text-brand-600" aria-hidden>
              ★
            </span>{" "}
            {formatRatingValue(media)} · {total}
          </p>
        ) : null}
      </div>
      <p className="mt-1 text-sm text-calm-600">Notas e comentários publicados por pacientes.</p>

      {loading ? (
        <ul className="mt-4 space-y-3" aria-busy="true">
          {Array.from({ length: 2 }).map((_, i) => (
            <li key={i} className="h-20 animate-pulse rounded-lg bg-calm-100/80" />
          ))}
        </ul>
      ) : itens.length === 0 ? (
        <div className="mt-5 rounded-lg border border-dashed border-calm-200 bg-calm-50/60 px-4 py-8 text-center">
          <p className="text-sm font-medium text-calm-800">Ainda sem avaliações</p>
          <p className="mt-1 text-sm text-calm-600">
            Após as primeiras consultas, o feedback dos pacientes aparece aqui.
          </p>
        </div>
      ) : (
        <ul className="mt-4 space-y-3">
          {itens.map((item, idx) => (
            <li key={`${item.criadoEm}-${idx}`} className="rounded-lg border border-calm-100 bg-calm-50/50 p-4">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-brand-600" aria-hidden>
                  {starsText(item.nota)}
                </span>
                <span className="text-xs text-calm-600">{formatReviewDate(item.criadoEm)}</span>
              </div>
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
