"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { formatBRL, TOPUP_MAX_CENTS, TOPUP_MIN_CENTS, TOPUP_PACKAGES_CENTS } from "@khoros/shared";
import { useAuth } from "@/lib/auth-context";
import { fetchApi, ApiError } from "@/lib/api";
import type { LedgerEntry, LedgerResponse, TopupResponse, WalletSummary } from "@/lib/api-types";

const LEDGER_LABEL: Record<string, string> = {
  RECARGA: "Recarga",
  HOLD: "Reserva para consulta",
  HOLD_RELEASE: "Liberação de reserva",
  DEBITO_SESSAO: "Consulta",
  REEMBOLSO: "Reembolso",
  REPASSE: "Repasse recebido",
  COMISSAO: "Comissão da plataforma",
  AJUSTE_ADMIN: "Ajuste administrativo",
};

function isCreditTipo(tipo: string, valorCentavos: number): boolean {
  if (tipo === "RECARGA" || tipo === "REEMBOLSO" || tipo === "HOLD_RELEASE" || tipo === "REPASSE") {
    return true;
  }
  if (tipo === "DEBITO_SESSAO" || tipo === "HOLD" || tipo === "COMISSAO") {
    return false;
  }
  return valorCentavos >= 0;
}

function monthKey(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${d.getMonth()}`;
}

function formatLedgerDate(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function CarteiraPage() {
  const { session } = useAuth();
  const [wallet, setWallet] = useState<WalletSummary | null>(null);
  const [ledger, setLedger] = useState<LedgerEntry[] | null>(null);
  const [customValue, setCustomValue] = useState("");
  const [cpfCnpj, setCpfCnpj] = useState("");
  const [topup, setTopup] = useState<TopupResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingPackage, setLoadingPackage] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  const loadWallet = useCallback(async () => {
    if (!session?.access_token) return;
    try {
      const data = await fetchApi<WalletSummary>("/wallet", { token: session.access_token });
      setWallet(data);
    } catch {
      // Sem fallback — mostra "—" enquanto o carregamento falhar.
    }
    try {
      const entries = await fetchApi<LedgerResponse>("/wallet/ledger", { token: session.access_token });
      setLedger(entries.items);
    } catch {
      setLedger([]);
    }
  }, [session]);

  useEffect(() => {
    void loadWallet();
  }, [loadWallet]);

  const monthSummary = useMemo(() => {
    const nowKey = monthKey(new Date().toISOString());
    let consultasCentavos = 0;
    let recargasCentavos = 0;
    for (const entry of ledger ?? []) {
      if (monthKey(entry.created_at) !== nowKey) continue;
      if (entry.tipo === "DEBITO_SESSAO") {
        consultasCentavos += Math.abs(entry.valor_centavos);
      } else if (entry.tipo === "RECARGA") {
        recargasCentavos += Math.abs(entry.valor_centavos);
      }
    }
    return { consultasCentavos, recargasCentavos };
  }, [ledger]);

  async function handleTopup(valorCentavos: number) {
    if (!session?.access_token) return;
    const doc = cpfCnpj.replace(/\D/g, "");
    if (!/^\d{11}$|^\d{14}$/.test(doc)) {
      setError("Informe um CPF (11 dígitos) ou CNPJ (14 dígitos) para gerar o Pix.");
      return;
    }
    setError(null);
    setTopup(null);
    setLoadingPackage(valorCentavos);
    try {
      const res = await fetchApi<TopupResponse>("/wallet/topup", {
        method: "POST",
        token: session.access_token,
        body: { valorCentavos, cpfCnpj: doc },
      });
      setTopup(res);
      await loadWallet();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível iniciar a recarga.");
    } finally {
      setLoadingPackage(null);
    }
  }

  function handleCustomTopup() {
    const cents = Math.round(parseFloat(customValue.replace(",", ".")) * 100);
    if (!cents || cents < TOPUP_MIN_CENTS || cents > TOPUP_MAX_CENTS) {
      setError(
        `Informe um valor entre ${formatBRL(TOPUP_MIN_CENTS)} e ${formatBRL(TOPUP_MAX_CENTS)}.`,
      );
      return;
    }
    void handleTopup(cents);
  }

  async function copyPix() {
    if (!topup?.qrCodePayload) return;
    await navigator.clipboard.writeText(topup.qrCodePayload);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (!session) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-16 text-center">
        <p className="text-calm-800">Entre na sua conta para ver sua carteira.</p>
        <a href="/entrar" className="mt-4 inline-block font-medium text-brand-700 underline hover:text-brand-800">
          Ir para o login
        </a>
      </main>
    );
  }

  const reserved = wallet?.saldo_reservado_centavos ?? 0;

  return (
    <main className="atmosphere-panel min-h-[calc(100vh-4rem)]">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:py-10">
        <header className="mb-8">
          <p className="text-sm text-calm-600">Saldo pré-pago · Pix</p>
          <h1 className="font-display text-3xl tracking-tight text-calm-900 sm:text-4xl">Carteira</h1>
          <p className="mt-2 max-w-xl text-sm text-calm-600">
            Recarregue por Pix e use o saldo nas consultas. O tempo é medido pelo servidor; você só paga os
            minutos usados.
          </p>
        </header>

        {/* Hero saldo */}
        <section
          aria-label="Saldo"
          className="overflow-hidden rounded-card border border-calm-200/80 bg-white/90 shadow-[0_1px_0_rgba(22,34,34,0.04)]"
        >
          <div className="grid gap-0 sm:grid-cols-[1.4fr_1fr]">
            <div className="relative px-6 py-7 sm:px-8 sm:py-8">
              <div
                className="pointer-events-none absolute inset-0 opacity-70"
                aria-hidden
                style={{
                  background:
                    "radial-gradient(70% 80% at 0% 0%, color-mix(in srgb, var(--color-brand-100) 80%, transparent), transparent 60%)",
                }}
              />
              <div className="relative">
                <p className="text-xs font-medium uppercase tracking-wide text-calm-600">
                  Saldo disponível
                </p>
                <p className="mt-2 font-display text-4xl tracking-tight text-calm-900 tabular-nums sm:text-5xl">
                  {wallet ? formatBRL(wallet.saldo_centavos) : "—"}
                </p>
                <p className="mt-3 text-sm text-calm-600">
                  Disponível para iniciar ou continuar uma consulta.
                </p>
              </div>
            </div>
            <div className="border-t border-calm-200/80 bg-sage-100/40 px-6 py-7 sm:border-l sm:border-t-0 sm:px-8 sm:py-8">
              <p className="text-xs font-medium uppercase tracking-wide text-calm-600">Reservado</p>
              <p className="mt-2 font-display text-2xl tracking-tight text-calm-900 tabular-nums sm:text-3xl">
                {wallet ? formatBRL(reserved) : "—"}
              </p>
              <p className="mt-3 text-sm text-calm-600">
                {reserved > 0
                  ? "Hold mínimo para consulta em andamento. Liberado ou debitado ao encerrar."
                  : "Nenhuma reserva ativa no momento."}
              </p>
            </div>
          </div>
        </section>

        {/* Resumo do mês */}
        <section aria-label="Resumo do mês" className="mt-6">
          <div className="grid grid-cols-2 gap-3">
            <div className="min-w-0 rounded-card border border-calm-200/80 bg-white/80 px-4 py-4 sm:px-5">
              <p className="text-xs font-medium uppercase tracking-wide text-calm-600">
                Consultas este mês
              </p>
              <p className="mt-1.5 font-display text-2xl tracking-tight text-calm-900 tabular-nums">
                {ledger === null ? "—" : formatBRL(monthSummary.consultasCentavos)}
              </p>
              <p className="mt-1 text-xs text-calm-600">débito de sessões</p>
            </div>
            <div className="min-w-0 rounded-card border border-calm-200/80 bg-white/80 px-4 py-4 sm:px-5">
              <p className="text-xs font-medium uppercase tracking-wide text-calm-600">
                Recargas este mês
              </p>
              <p className="mt-1.5 font-display text-2xl tracking-tight text-sage-600 tabular-nums">
                {ledger === null ? "—" : formatBRL(monthSummary.recargasCentavos)}
              </p>
              <p className="mt-1 text-xs text-calm-600">créditos via Pix</p>
            </div>
          </div>
        </section>

        {/* Recarga Pix */}
        <section className="mt-10" aria-labelledby="topup-heading">
          <h2 id="topup-heading" className="font-display text-xl tracking-tight text-calm-900">
            Adicionar saldo
          </h2>
          <p className="mt-1 text-sm text-calm-600">Pix instantâneo. O crédito entra após a confirmação.</p>

          <div className="mt-5 rounded-card border border-calm-200/80 bg-white/90 p-5 sm:p-6">
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-calm-800">CPF ou CNPJ do pagador</span>
              <input
                inputMode="numeric"
                placeholder="Somente números"
                value={cpfCnpj}
                onChange={(e) => setCpfCnpj(e.target.value)}
                className="max-w-md rounded-md border border-calm-200 bg-white px-3 py-2.5 text-calm-900 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-200"
              />
            </label>

            <p className="mt-5 text-xs font-medium uppercase tracking-wide text-calm-600">Pacotes</p>
            <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-3">
              {TOPUP_PACKAGES_CENTS.map((cents) => {
                const busy = loadingPackage === cents;
                return (
                  <button
                    key={cents}
                    type="button"
                    onClick={() => handleTopup(cents)}
                    disabled={loadingPackage !== null}
                    className="group flex flex-col items-start rounded-card border border-calm-200 bg-calm-50/80 px-4 py-4 text-left transition hover:border-brand-200 hover:bg-brand-50 disabled:opacity-60"
                  >
                    <span className="font-display text-2xl tracking-tight text-calm-900 tabular-nums">
                      {busy ? "…" : formatBRL(cents)}
                    </span>
                    <span className="mt-1 text-xs text-calm-600 group-hover:text-brand-700">
                      Gerar Pix
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:items-stretch">
              <input
                inputMode="decimal"
                placeholder={`Outro valor (${formatBRL(TOPUP_MIN_CENTS)}–${formatBRL(TOPUP_MAX_CENTS)})`}
                value={customValue}
                onChange={(e) => setCustomValue(e.target.value)}
                className="flex-1 rounded-md border border-calm-200 bg-white px-3 py-2.5 text-calm-900 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-200"
              />
              <button
                type="button"
                onClick={handleCustomTopup}
                disabled={loadingPackage !== null}
                className="rounded-md bg-brand-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60 sm:shrink-0"
              >
                {loadingPackage !== null &&
                !TOPUP_PACKAGES_CENTS.includes(loadingPackage as (typeof TOPUP_PACKAGES_CENTS)[number])
                  ? "Gerando…"
                  : "Recarregar"}
              </button>
            </div>

            {error ? (
              <p role="alert" className="mt-4 text-sm text-red-700">
                {error}
              </p>
            ) : null}

            {topup ? (
              <div className="mt-6 overflow-hidden rounded-card border border-sage-100 bg-gradient-to-br from-sage-100/70 via-white to-brand-50/50">
                <div className="flex flex-col gap-6 p-5 sm:flex-row sm:items-start sm:p-6">
                  <div className="shrink-0 text-center sm:text-left">
                    <p className="text-xs font-medium uppercase tracking-wide text-sage-600">Pix</p>
                    <p className="mt-1 font-display text-xl tracking-tight text-calm-900">
                      {formatBRL(topup.valorCentavos)}
                    </p>
                    {topup.qrCodeImage ? (
                      <img
                        src={`data:image/png;base64,${topup.qrCodeImage}`}
                        alt="QR Code Pix"
                        className="mx-auto mt-4 h-44 w-44 rounded-md border border-calm-200 bg-white p-2 sm:mx-0"
                      />
                    ) : (
                      <div className="mx-auto mt-4 flex h-44 w-44 items-center justify-center rounded-md border border-dashed border-calm-200 bg-white text-xs text-calm-600 sm:mx-0">
                        QR indisponível — use o código
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-calm-900">Pague com Pix para concluir</p>
                    <p className="mt-1 text-sm text-calm-600">
                      Escaneie o QR ou copie o código. O saldo atualiza automaticamente após a
                      confirmação.
                    </p>
                    {topup.qrCodePayload ? (
                      <div className="mt-4">
                        <label className="text-xs font-medium uppercase tracking-wide text-calm-600">
                          Código copia e cola
                        </label>
                        <textarea
                          readOnly
                          value={topup.qrCodePayload}
                          className="mt-1.5 w-full rounded-md border border-calm-200 bg-white p-3 font-mono text-xs leading-relaxed text-calm-800"
                          rows={4}
                        />
                        <button
                          type="button"
                          onClick={copyPix}
                          className="mt-3 rounded-md border border-brand-200 bg-brand-50 px-4 py-2 text-sm font-medium text-brand-700 hover:bg-brand-100"
                        >
                          {copied ? "Copiado!" : "Copiar código Pix"}
                        </button>
                      </div>
                    ) : null}
                    {topup.expirationDate ? (
                      <p className="mt-4 text-xs text-calm-600">
                        Expira em{" "}
                        {new Date(topup.expirationDate).toLocaleString("pt-BR", {
                          day: "2-digit",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </section>

        {/* Extrato */}
        <section className="mt-10" aria-labelledby="ledger-heading">
          <h2 id="ledger-heading" className="font-display text-xl tracking-tight text-calm-900">
            Extrato
          </h2>
          <p className="mt-1 text-sm text-calm-600">Movimentações recentes da sua carteira.</p>

          {ledger === null ? (
            <p className="mt-4 text-sm text-calm-600">Carregando…</p>
          ) : ledger.length === 0 ? (
            <div className="mt-4 rounded-card border border-dashed border-calm-200 bg-white/60 px-5 py-10 text-center">
              <p className="text-sm text-calm-800">Nenhuma movimentação ainda.</p>
              <p className="mt-1 text-xs text-calm-600">
                Recargas e consultas aparecem aqui assim que ocorrerem.
              </p>
            </div>
          ) : (
            <ul className="mt-4 divide-y divide-calm-200/80 overflow-hidden rounded-card border border-calm-200/80 bg-white/90">
              {ledger.map((entry) => {
                const credit = isCreditTipo(entry.tipo, entry.valor_centavos);
                const label = LEDGER_LABEL[entry.tipo] ?? entry.tipo;
                const abs = Math.abs(entry.valor_centavos);
                return (
                  <li
                    key={entry.id}
                    className="flex items-start gap-3 px-4 py-3.5 sm:items-center sm:px-5"
                  >
                    <span
                      className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold sm:mt-0 ${
                        credit
                          ? "bg-sage-100 text-sage-600"
                          : "bg-calm-100 text-calm-800"
                      }`}
                      aria-hidden
                    >
                      {credit ? "+" : "−"}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-calm-900">{label}</p>
                      <p className="mt-0.5 text-xs text-calm-600">{formatLedgerDate(entry.created_at)}</p>
                    </div>
                    <span
                      className={`shrink-0 text-sm font-medium tabular-nums ${
                        credit ? "text-sage-600" : "text-calm-800"
                      }`}
                    >
                      {credit ? "+" : "−"}
                      {formatBRL(abs)}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
