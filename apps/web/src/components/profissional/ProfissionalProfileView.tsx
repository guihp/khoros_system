import Link from "next/link";
import type { PsychologistPublicProfile } from "@/lib/api-types";
import { ProfissionalHero } from "./ProfissionalHero";
import { ProfissionalReviews } from "./ProfissionalReviews";

interface ProfissionalProfileViewProps {
  profile: PsychologistPublicProfile;
  starting: boolean;
  onFalarAgora: () => void;
}

export function ProfissionalProfileView({
  profile,
  starting,
  onFalarAgora,
}: ProfissionalProfileViewProps) {
  const name = profile.users?.full_name ?? "Psicólogo";
  const available = profile.disponibilidade === "AVAILABLE";
  const abordagens = profile.abordagens ?? [];
  const especialidades = profile.especialidades ?? [];

  return (
    <main className="atmosphere-panel min-h-[calc(100vh-4rem)]">
      <div className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:space-y-8 sm:py-10">
        <Link
          href="/paciente"
          className="inline-flex text-sm font-medium text-brand-700 underline hover:text-brand-800"
        >
          ← Disponíveis agora
        </Link>

        <ProfissionalHero
          profile={profile}
          name={name}
          available={available}
          starting={starting}
          onFalarAgora={onFalarAgora}
        />

        {profile.bio ? (
          <section className="rounded-card border border-calm-200 bg-white/90 p-5 sm:p-6">
            <h2 className="font-display text-xl tracking-tight text-calm-900">Sobre</h2>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-calm-700">
              {profile.bio}
            </p>
          </section>
        ) : null}

        {(abordagens.length > 0 || especialidades.length > 0) && (
          <div className="grid gap-6 sm:grid-cols-2">
            {abordagens.length > 0 && (
              <section className="rounded-card border border-calm-200 bg-white/90 p-5 sm:p-6">
                <h2 className="font-display text-xl tracking-tight text-calm-900">Abordagens</h2>
                <p className="mt-1 text-sm text-calm-600">Linhas de trabalho deste profissional.</p>
                <ul className="mt-4 flex flex-wrap gap-2">
                  {abordagens.map((tag) => (
                    <li
                      key={`ab-${tag}`}
                      className="rounded-full border border-brand-100 bg-brand-50 px-3 py-1 text-xs font-medium text-brand-800"
                    >
                      {tag}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {especialidades.length > 0 && (
              <section className="rounded-card border border-calm-200 bg-white/90 p-5 sm:p-6">
                <h2 className="font-display text-xl tracking-tight text-calm-900">Especialidades</h2>
                <p className="mt-1 text-sm text-calm-600">Temas e públicos de maior foco.</p>
                <ul className="mt-4 flex flex-wrap gap-2">
                  {especialidades.map((tag) => (
                    <li
                      key={`esp-${tag}`}
                      className="rounded-full border border-calm-200 bg-calm-50 px-3 py-1 text-xs font-medium text-calm-800"
                    >
                      {tag}
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        )}

        <ProfissionalReviews avaliacao={profile.avaliacao} />

        <div className="rounded-card border border-calm-200 bg-white/90 p-5 sm:flex sm:items-center sm:justify-between sm:gap-6 sm:p-6">
          <div>
            <p className="font-display text-lg tracking-tight text-calm-900">
              Pronto para conversar?
            </p>
            <p className="mt-1 text-sm text-calm-600">
              {available
                ? `${name} está disponível agora. Você paga só pelos minutos usados.`
                : "Quando estiver online, você poderá iniciar a consulta daqui."}
            </p>
          </div>
          <button
            type="button"
            disabled={starting || !available}
            onClick={onFalarAgora}
            className="mt-4 w-full shrink-0 rounded-full bg-brand-600 px-6 py-3 text-sm font-medium text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60 sm:mt-0 sm:w-auto sm:min-w-[12rem]"
          >
            {starting ? "Abrindo…" : available ? "Falar agora" : "Indisponível agora"}
          </button>
        </div>
      </div>
    </main>
  );
}
