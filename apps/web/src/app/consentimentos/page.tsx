"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { fetchApi, ApiError } from "@/lib/api";
import type { ConsentStatusResponse } from "@/lib/api-types";

export default function ConsentimentosPage() {
  const { session, loading: authLoading, refresh } = useAuth();
  const router = useRouter();

  const [status, setStatus] = useState<ConsentStatusResponse | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [termoAceito, setTermoAceito] = useState(false);
  const [lgpdAceito, setLgpdAceito] = useState(false);
  const [responsavelNome, setResponsavelNome] = useState("");
  const [responsavelParentesco, setResponsavelParentesco] = useState("");
  const [responsavelAceito, setResponsavelAceito] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isMinor = status?.isMinor ?? false;

  const loadStatus = useCallback(async () => {
    if (!session?.access_token) return;
    setLoadingStatus(true);
    try {
      const data = await fetchApi<ConsentStatusResponse>("/consents/status", {
        token: session.access_token,
      });
      setStatus(data);
    } catch {
      setStatus(null);
    } finally {
      setLoadingStatus(false);
    }
  }, [session]);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  const allDone = Boolean(status?.termoOk && status?.lgpdOk && status?.responsavelLegalOk);

  async function handleSubmit() {
    if (!session?.access_token) return;
    setError(null);

    if (!termoAceito || !lgpdAceito || (isMinor && !responsavelAceito)) {
      setError("É necessário aceitar todos os termos para continuar.");
      return;
    }
    if (isMinor && (!responsavelNome.trim() || !responsavelParentesco.trim())) {
      setError("Informe o nome e o vínculo do responsável legal.");
      return;
    }

    setSubmitting(true);
    try {
      await fetchApi("/consents/accept", {
        method: "POST",
        token: session.access_token,
        body: { tipo: "TERMO_CONSENTIMENTO" },
      });
      await fetchApi("/consents/accept", {
        method: "POST",
        token: session.access_token,
        body: { tipo: "LGPD" },
      });
      if (isMinor) {
        await fetchApi("/consents/accept", {
          method: "POST",
          token: session.access_token,
          body: { tipo: "RESPONSAVEL_LEGAL", responsavelNome },
        });
      }
      await refresh();
      await loadStatus();
      router.push("/paciente");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível registrar seu consentimento.");
    } finally {
      setSubmitting(false);
    }
  }

  if (authLoading) {
    return <main className="mx-auto max-w-lg px-4 py-16 text-calm-600">Carregando…</main>;
  }

  if (!session) {
    return (
      <main className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="text-calm-800">Você precisa entrar para revisar os termos.</p>
        <a href="/entrar" className="mt-4 inline-block text-brand-700 underline">
          Ir para o login
        </a>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-lg px-4 py-12">
      <h1 className="text-2xl font-semibold text-calm-900">Antes da sua primeira consulta</h1>
      <p className="mt-2 text-sm text-calm-600">
        Pedimos alguns consentimentos para garantir seu cuidado e sua privacidade, conforme as
        normas do CFP e a LGPD.
      </p>

      {loadingStatus ? (
        <p className="mt-8 text-sm text-calm-600">Verificando seus consentimentos…</p>
      ) : allDone ? (
        <div className="mt-8 rounded-card border border-sage-100 bg-sage-100/40 p-5">
          <p className="text-sm font-medium text-calm-900">Tudo certo!</p>
          <p className="mt-1 text-sm text-calm-600">
            Você já aceitou os termos necessários. Pode seguir para escolher um psicólogo.
          </p>
          <a
            href="/paciente"
            className="mt-4 inline-block rounded-full bg-brand-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-700"
          >
            Ver psicólogos
          </a>
        </div>
      ) : (
        <div className="mt-8 flex flex-col gap-6">
          <section className="rounded-card border border-calm-200 bg-white p-5">
            <h2 className="text-sm font-semibold text-calm-900">
              Termo de Consentimento Livre e Esclarecido
              {status?.versaoTermo ? ` (versão ${status.versaoTermo})` : ""}
            </h2>
            <p className="mt-2 text-sm text-calm-600">
              O atendimento é realizado por psicólogo com inscrição ativa no CRP, por vídeo.
              Sessões não são gravadas. Em caso de crise, urgência ou emergência, a plataforma
              encaminha para canais especializados (CVV, SAMU, CAPS) — não realiza atendimento
              presencial nem de emergência.
            </p>
            <label className="mt-3 flex items-start gap-2 text-sm text-calm-800">
              <input
                type="checkbox"
                checked={termoAceito}
                onChange={(e) => setTermoAceito(e.target.checked)}
                className="mt-0.5"
              />
              Li e aceito o Termo de Consentimento Livre e Esclarecido.
            </label>
          </section>

          <section className="rounded-card border border-calm-200 bg-white p-5">
            <h2 className="text-sm font-semibold text-calm-900">
              Privacidade e proteção de dados — LGPD
              {status?.versaoLgpd ? ` (versão ${status.versaoLgpd})` : ""}
            </h2>
            <p className="mt-2 text-sm text-calm-600">
              Seus dados de saúde são sensíveis: usamos criptografia em repouso e em trânsito, e
              apenas o psicólogo responsável pelo seu atendimento acessa seu prontuário. Você
              pode solicitar exportação ou exclusão dos seus dados a qualquer momento.
            </p>
            <label className="mt-3 flex items-start gap-2 text-sm text-calm-800">
              <input
                type="checkbox"
                checked={lgpdAceito}
                onChange={(e) => setLgpdAceito(e.target.checked)}
                className="mt-0.5"
              />
              Li e aceito os termos de privacidade e tratamento de dados (LGPD).
            </label>
          </section>

          {isMinor && (
            <section className="rounded-card border border-warn-100 bg-warn-100/40 p-5">
              <h2 className="text-sm font-semibold text-calm-900">Consentimento do responsável legal</h2>
              <p className="mt-2 text-sm text-calm-600">
                Identificamos que você é menor de idade. É necessário o consentimento expresso de
                um responsável legal para continuar.
              </p>
              <div className="mt-3 flex flex-col gap-3">
                <label className="flex flex-col gap-1.5">
                  <span className="text-sm font-medium text-calm-800">Nome do responsável</span>
                  <input
                    value={responsavelNome}
                    onChange={(e) => setResponsavelNome(e.target.value)}
                    className="rounded-md border border-calm-200 px-3 py-2.5 text-calm-900 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-200"
                  />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-sm font-medium text-calm-800">Vínculo (ex.: mãe, pai, tutor)</span>
                  <input
                    value={responsavelParentesco}
                    onChange={(e) => setResponsavelParentesco(e.target.value)}
                    className="rounded-md border border-calm-200 px-3 py-2.5 text-calm-900 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-200"
                  />
                </label>
                <label className="flex items-start gap-2 text-sm text-calm-800">
                  <input
                    type="checkbox"
                    checked={responsavelAceito}
                    onChange={(e) => setResponsavelAceito(e.target.checked)}
                    className="mt-0.5"
                  />
                  Como responsável legal, autorizo expressamente este atendimento.
                </label>
              </div>
            </section>
          )}

          {error && (
            <p role="alert" className="text-sm text-red-700">
              {error}
            </p>
          )}

          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="rounded-full bg-brand-600 px-6 py-3 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
          >
            {submitting ? "Salvando…" : "Aceitar e continuar"}
          </button>
        </div>
      )}
    </main>
  );
}
