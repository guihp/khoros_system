"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { fetchApi, ApiError } from "@/lib/api";
import { starsText } from "@/lib/format-rating";
import type { SessionReview, SessionReviewResponse } from "@/lib/api-types";

/**
 * Formulário simples de avaliação pós-consulta. Só o paciente avalia (uma vez
 * por sessão) — decide sozinho se deve renderizar algo com base no papel do
 * usuário logado, para poder ser plugado direto no estado "encerrada" do
 * SessionRoom (compartilhado com a sala do psicólogo).
 */
export function SessionReviewForm({ sessionId }: { sessionId: string }) {
  const { session, me } = useAuth();
  const [review, setReview] = useState<SessionReview | null>(null);
  const [loading, setLoading] = useState(true);
  const [nota, setNota] = useState(0);
  const [comentario, setComentario] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isPatient = me?.registered && me.role === "PATIENT";

  useEffect(() => {
    if (!session?.access_token || !isPatient) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchApi<SessionReviewResponse>(`/sessions/${sessionId}/review`, {
          token: session.access_token,
        });
        if (!cancelled) setReview(data.review);
      } catch {
        // Best-effort: se falhar, mostramos o formulário e deixamos o backend recusar duplicidade.
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [session, sessionId, isPatient]);

  async function handleSubmit() {
    if (!session?.access_token || nota === 0) return;
    setSubmitting(true);
    setError(null);
    try {
      const data = await fetchApi<SessionReview>(`/sessions/${sessionId}/review`, {
        method: "POST",
        token: session.access_token,
        body: { nota, comentario: comentario.trim() || undefined },
      });
      setReview(data);
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        // Já avaliada (ex.: outra aba) — refaz a leitura para mostrar o estado real.
        try {
          const data = await fetchApi<SessionReviewResponse>(`/sessions/${sessionId}/review`, {
            token: session.access_token,
          });
          setReview(data.review);
        } catch {
          setError("Esta consulta já foi avaliada.");
        }
      } else {
        setError(err instanceof ApiError ? err.message : "Não foi possível enviar sua avaliação.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (!isPatient || loading) return null;

  if (review) {
    return (
      <div className="mt-6 w-full rounded-card border border-calm-200 bg-calm-50 p-4 text-center">
        <p className="text-sm font-medium text-calm-900">Obrigado pela sua avaliação</p>
        <p className="mt-1 text-lg text-brand-600" aria-hidden>
          {starsText(review.nota)}
        </p>
        {review.comentario && <p className="mt-2 text-sm text-calm-600">“{review.comentario}”</p>}
      </div>
    );
  }

  return (
    <div className="mt-6 w-full rounded-card border border-calm-200 bg-white p-4 text-left">
      <p className="text-sm font-medium text-calm-900">Como foi sua consulta?</p>
      <div className="mt-2 flex justify-center gap-1" role="radiogroup" aria-label="Nota de 1 a 5">
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={nota === value}
            aria-label={`${value} de 5 estrelas`}
            onClick={() => setNota(value)}
            className={`text-2xl leading-none ${value <= nota ? "text-brand-600" : "text-calm-300"} hover:text-brand-500`}
          >
            {value <= nota ? "★" : "☆"}
          </button>
        ))}
      </div>
      <textarea
        value={comentario}
        onChange={(e) => setComentario(e.target.value)}
        maxLength={1000}
        rows={2}
        placeholder="Comentário (opcional)"
        className="mt-3 w-full rounded-md border border-calm-200 bg-white p-2.5 text-sm text-calm-900 placeholder:text-calm-400 focus:border-brand-400 focus:outline-none"
      />
      {error && <p className="mt-2 text-xs text-red-700">{error}</p>}
      <button
        type="button"
        disabled={nota === 0 || submitting}
        onClick={handleSubmit}
        className="mt-3 w-full rounded-full bg-brand-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? "Enviando…" : "Enviar avaliação"}
      </button>
    </div>
  );
}
