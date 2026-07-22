import { formatBRL } from "@khoros/shared";
import { formatRatingValue } from "@/lib/format-rating";
import type { PsychologistPublicProfile } from "@/lib/api-types";
import { psychologistInitials } from "./format-profissional";

interface ProfissionalHeroProps {
  profile: PsychologistPublicProfile;
  name: string;
  available: boolean;
  starting: boolean;
  onFalarAgora: () => void;
}

export function ProfissionalHero({
  profile,
  name,
  available,
  starting,
  onFalarAgora,
}: ProfissionalHeroProps) {
  const hasRatings = profile.avaliacao.total > 0;

  return (
    <article className="overflow-hidden rounded-card border border-calm-200 bg-white/90 shadow-sm">
      <div className="grid lg:grid-cols-[minmax(0,18rem)_minmax(0,1fr)] xl:grid-cols-[minmax(0,20rem)_minmax(0,1fr)]">
        <div className="atmosphere-panel relative aspect-[4/3] w-full overflow-hidden lg:aspect-auto lg:min-h-[16rem]">
          {profile.foto_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.foto_url}
              alt={`Foto de ${name}`}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <span
                aria-hidden
                className="flex h-24 w-24 items-center justify-center rounded-full bg-white/85 text-2xl font-semibold text-brand-700 shadow-sm ring-1 ring-brand-100"
              >
                {psychologistInitials(name)}
              </span>
            </div>
          )}
        </div>

        <div className="flex flex-col justify-between gap-6 p-5 sm:p-6 lg:p-8">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center rounded-full border border-calm-200 bg-calm-50 px-2.5 py-0.5 text-xs font-medium text-calm-800">
                CRP {profile.crp_numero}/{profile.crp_regiao}
              </span>
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  available ? "bg-sage-100 text-sage-600" : "bg-calm-100 text-calm-600"
                }`}
              >
                {available ? "● Disponível agora" : "Offline no momento"}
              </span>
            </div>

            <h1 className="mt-3 font-display text-3xl tracking-tight text-calm-900 sm:text-4xl">
              {name}
            </h1>

            <p className="mt-3 text-lg font-medium text-calm-900">
              {formatBRL(profile.preco_por_minuto_centavos)}
              <span className="font-normal text-calm-600">/min</span>
            </p>

            <p className="mt-2 text-sm text-calm-600">
              {profile.consultasRealizadas}{" "}
              {profile.consultasRealizadas === 1 ? "consulta" : "consultas"}
              {hasRatings && (
                <>
                  {" "}
                  ·{" "}
                  <span className="text-brand-600" aria-hidden>
                    ★
                  </span>{" "}
                  {formatRatingValue(profile.avaliacao.media ?? 0)} · {profile.avaliacao.total}{" "}
                  {profile.avaliacao.total === 1 ? "avaliação" : "avaliações"}
                </>
              )}
            </p>
          </div>

          <div>
            <button
              type="button"
              disabled={starting || !available}
              onClick={onFalarAgora}
              className="w-full rounded-full bg-brand-600 px-6 py-3 text-sm font-medium text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:min-w-[12rem]"
            >
              {starting ? "Abrindo…" : available ? "Falar agora" : "Indisponível agora"}
            </button>
            {!available && (
              <p className="mt-3 text-xs leading-relaxed text-calm-600">
                Este profissional não está disponível neste momento. Volte ao cardápio para ver quem
                está online.
              </p>
            )}
            {available && (
              <p className="mt-3 text-xs leading-relaxed text-calm-600">
                Pago por minuto · sem agendamento · tempo medido pela plataforma
              </p>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
