"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { screeningBlocks, type CrisisScreeningAnswers } from "@khoros/shared";
import { useAuth } from "@/lib/auth-context";
import { fetchApi, ApiError } from "@/lib/api";
import type { ScreeningResponse, StartSessionResponse } from "@/lib/api-types";
import { saveSessionCredentials } from "@/lib/session-storage";

const QUESTIONS: { key: keyof CrisisScreeningAnswers; label: string }[] = [
  {
    key: "riscoDeVida",
    label: "Neste momento, você sente que sua vida ou a de alguém está em risco imediato?",
  },
  {
    key: "ideacaoSuicida",
    label: "Você tem pensado em se machucar ou tirar a própria vida?",
  },
  {
    key: "situacaoDeViolencia",
    label: "Você está vivendo agora uma situação de violência ou violação de direitos?",
  },
  {
    key: "emergenciaMedica",
    label: "Você está passando por uma emergência médica agora?",
  },
];

function OptionPill({
  label,
  selected,
  onSelect,
  name,
}: {
  label: string;
  selected: boolean;
  onSelect: () => void;
  name: string;
}) {
  return (
    <label
      className={`flex flex-1 cursor-pointer items-center justify-center rounded-full border px-4 py-2.5 text-sm font-medium transition-colors ${
        selected
          ? "border-brand-600 bg-brand-50 text-brand-800"
          : "border-calm-200 bg-white text-calm-700 hover:border-calm-400"
      }`}
    >
      <input type="radio" name={name} checked={selected} onChange={onSelect} className="sr-only" />
      {label}
    </label>
  );
}

function TriagemForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const psychologistId = searchParams.get("psy");
  const { session } = useAuth();

  const [answers, setAnswers] = useState<Partial<Record<keyof CrisisScreeningAnswers, boolean>>>(
    {},
  );
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const answeredCount = QUESTIONS.filter((q) => answers[q.key] !== undefined).length;
  const allAnswered = answeredCount === QUESTIONS.length;

  async function handleSubmit() {
    if (!session?.access_token) {
      setError("Você precisa entrar para continuar.");
      return;
    }
    if (!allAnswered) {
      setError("Responda todas as perguntas para continuar.");
      return;
    }

    setError(null);
    setSubmitting(true);
    try {
      const fullAnswers = answers as CrisisScreeningAnswers;
      const blocked = screeningBlocks(fullAnswers);

      const result = await fetchApi<ScreeningResponse>("/screening", {
        method: "POST",
        token: session.access_token,
        body: fullAnswers,
      });

      if (blocked || result.resultado === "BLOQUEADO") {
        router.push("/apoio");
        return;
      }

      if (psychologistId) {
        const started = await fetchApi<StartSessionResponse>("/sessions/start", {
          method: "POST",
          token: session.access_token,
          body: { psychologistId, screeningId: result.screeningId },
        });
        saveSessionCredentials(started.sessionId, {
          livekitUrl: started.livekitUrl,
          hbSecret: started.hbSecret,
          patientToken: started.patientToken,
        });
        router.push(`/sessao/${started.sessionId}`);
        return;
      }

      router.push("/paciente");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível concluir a triagem.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen flex-col overflow-x-hidden bg-calm-50">
      <div className="flex-1 px-4 py-10 sm:py-14">
        <div className="mx-auto max-w-2xl">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700">
            Etapa obrigatória de cuidado
          </span>
          <h1 className="mt-4 text-2xl font-semibold text-calm-900 sm:text-3xl">
            Antes de começar
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-calm-600 sm:text-base">
            Estas perguntas nos ajudam a garantir que este seja o canal certo de cuidado para você
            agora. Responda com sinceridade — não há resposta certa ou errada.
          </p>

          <div className="mt-5 flex items-start gap-3 rounded-card border border-calm-200 bg-white p-4">
            <span aria-hidden className="mt-0.5 text-lg">
              🔒
            </span>
            <p className="text-sm text-calm-600">
              Suas respostas individuais <span className="font-medium text-calm-800">não ficam
              armazenadas</span>. Elas servem apenas para decidir, neste momento, se o atendimento
              por vídeo é adequado.
            </p>
          </div>

          <div className="mt-8 flex items-center gap-3">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-calm-200">
              <div
                className="h-full rounded-full bg-brand-600 transition-all"
                style={{ width: `${(answeredCount / QUESTIONS.length) * 100}%` }}
              />
            </div>
            <span className="shrink-0 text-xs font-medium text-calm-600">
              {answeredCount} de {QUESTIONS.length}
            </span>
          </div>

          <div className="mt-6 flex flex-col gap-4">
            {QUESTIONS.map((q, index) => (
              <fieldset
                key={q.key}
                className="min-w-0 rounded-card border border-calm-200 bg-white p-5 sm:p-6"
              >
                <legend className="sr-only">{q.label}</legend>
                <div className="flex gap-3">
                  <span
                    aria-hidden
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs font-semibold text-brand-700"
                  >
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p
                      id={`triagem-q-${q.key}`}
                      className="break-words whitespace-normal text-sm font-medium leading-relaxed text-calm-900 sm:text-[15px]"
                    >
                      {q.label}
                    </p>
                    <div
                      role="group"
                      aria-labelledby={`triagem-q-${q.key}`}
                      className="mt-4 flex max-w-xs gap-3"
                    >
                      <OptionPill
                        label="Sim"
                        name={q.key}
                        selected={answers[q.key] === true}
                        onSelect={() => setAnswers((a) => ({ ...a, [q.key]: true }))}
                      />
                      <OptionPill
                        label="Não"
                        name={q.key}
                        selected={answers[q.key] === false}
                        onSelect={() => setAnswers((a) => ({ ...a, [q.key]: false }))}
                      />
                    </div>
                  </div>
                </div>
              </fieldset>
            ))}
          </div>
        </div>
      </div>

      <div className="sticky bottom-0 border-t border-calm-200 bg-white/95 px-4 py-4 backdrop-blur">
        <div className="mx-auto max-w-2xl">
          {error && (
            <p role="alert" className="mb-3 text-sm text-red-700">
              {error}
            </p>
          )}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || !allAnswered}
            className="w-full rounded-full bg-brand-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          >
            {submitting ? "Verificando…" : "Continuar"}
          </button>
          <p className="mt-3 text-center text-xs text-calm-600 sm:text-left">
            Precisa de ajuda agora?{" "}
            <a href="/apoio" className="text-brand-700 underline hover:text-brand-800">
              Ver canais de apoio
            </a>
          </p>
        </div>
      </div>
    </main>
  );
}

export default function TriagemPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-calm-50 px-4 text-calm-600">
          Carregando…
        </main>
      }
    >
      <TriagemForm />
    </Suspense>
  );
}
