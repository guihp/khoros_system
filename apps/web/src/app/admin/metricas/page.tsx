"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AdminGate, useAdminToken } from "@/components/admin/AdminGate";
import { fetchApi, ApiError } from "@/lib/api";
import type { MetricsSummaryResponse } from "@/lib/api-types";

type PeriodDays = 7 | 30 | 90;

const PERIODS: { value: PeriodDays; label: string }[] = [
  { value: 7, label: "7 dias" },
  { value: 30, label: "30 dias" },
  { value: 90, label: "90 dias" },
];

const FUNNEL_STEPS: { key: string; label: string }[] = [
  { key: "validation_needs_help", label: "Precisa de orientação" },
  { key: "lead_form_open", label: "Abriu formulário" },
  { key: "lead_form_submit", label: "Enviou formulário" },
  { key: "lead_form_success", label: "Lead criado" },
];

function rangeForDays(days: PeriodDays): { from: string; to: string } {
  const to = new Date();
  const from = new Date(to.getTime() - days * 24 * 60 * 60 * 1000);
  return { from: from.toISOString(), to: to.toISOString() };
}

function formatInt(n: number): string {
  return n.toLocaleString("pt-BR");
}

function formatDay(isoDate: string): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  if (!y || !m || !d) return isoDate;
  return new Date(y, m - 1, d).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
  });
}

function deviceLabel(type: string): string {
  if (type === "mobile") return "Mobile";
  if (type === "desktop") return "Desktop";
  if (type === "tablet") return "Tablet";
  return type;
}

function KpiCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-card border border-calm-200 bg-white p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-calm-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-calm-900">{formatInt(value)}</p>
    </div>
  );
}

function CountTable({
  title,
  empty,
  rows,
  labelKey,
}: {
  title: string;
  empty: string;
  rows: { label: string; count: number }[];
  labelKey: string;
}) {
  return (
    <section className="rounded-card border border-calm-200 bg-white">
      <h2 className="border-b border-calm-100 px-4 py-3 text-sm font-semibold text-calm-900">
        {title}
      </h2>
      {rows.length === 0 ? (
        <p className="px-4 py-6 text-sm text-calm-600">{empty}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-calm-100 bg-calm-50/80 text-calm-700">
              <tr>
                <th className="px-4 py-2 font-medium">{labelKey}</th>
                <th className="px-4 py-2 text-right font-medium">Qtd</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-calm-100">
              {rows.map((row) => (
                <tr key={row.label} className="text-calm-900">
                  <td className="max-w-[280px] truncate px-4 py-2.5 text-calm-800" title={row.label}>
                    {row.label}
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-calm-700">
                    {formatInt(row.count)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function MetricsDashboard() {
  const token = useAdminToken();
  const [days, setDays] = useState<PeriodDays>(30);
  const [data, setData] = useState<MetricsSummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const { from, to } = rangeForDays(days);
      const params = new URLSearchParams({ from, to });
      const summary = await fetchApi<MetricsSummaryResponse>(
        `/admin/metrics/summary?${params}`,
        { token },
      );
      setData(summary);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível carregar as métricas.");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [token, days]);

  useEffect(() => {
    void load();
  }, [load]);

  const maxDaily = useMemo(() => {
    if (!data?.daily.length) return 1;
    return Math.max(1, ...data.daily.map((d) => d.pageviews));
  }, [data]);

  const deviceTotal = useMemo(() => {
    if (!data?.devices.length) return 0;
    return data.devices.reduce((sum, d) => sum + d.count, 0);
  }, [data]);

  const funnelMax = useMemo(() => {
    if (!data) return 1;
    return Math.max(1, ...FUNNEL_STEPS.map((s) => data.funnel[s.key] ?? 0));
  }, [data]);

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <p className="text-sm text-calm-600">
        <Link href="/admin" className="hover:text-brand-700">
          Admin
        </Link>
        <span className="mx-1.5 text-calm-400">/</span>
        Métricas
      </p>
      <h1 className="mt-2 text-2xl font-semibold text-calm-900">Métricas do blog</h1>
      <p className="mt-2 text-sm text-calm-600">
        Pageviews, origem e funil de captura — analytics first-party (sem PII).
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        {PERIODS.map((period) => (
          <button
            key={period.value}
            type="button"
            onClick={() => setDays(period.value)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              days === period.value
                ? "bg-sage-600 text-white"
                : "border border-calm-200 bg-white text-calm-800 hover:bg-calm-100"
            }`}
          >
            {period.label}
          </button>
        ))}
      </div>

      {error && <p className="mt-4 text-sm text-red-700">{error}</p>}

      {loading ? (
        <p className="mt-8 text-sm text-calm-600">Carregando…</p>
      ) : !data ? (
        <p className="mt-8 rounded-card border border-calm-200 bg-white p-6 text-sm text-calm-600">
          Sem dados para o período. Navegue no blog para gerar pageviews.
        </p>
      ) : (
        <>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard label="Pageviews" value={data.pageviews} />
            <KpiCard label="Visitantes únicos" value={data.unique_visitors} />
            <KpiCard label="Sessões" value={data.unique_sessions} />
            <KpiCard label="Leads" value={data.leads_count} />
          </div>

          <section className="mt-8 rounded-card border border-calm-200 bg-white p-4">
            <h2 className="text-sm font-semibold text-calm-900">Funil de validação → lead</h2>
            <div className="mt-4 flex flex-col gap-3">
              {FUNNEL_STEPS.map((step) => {
                const count = data.funnel[step.key] ?? 0;
                const pct = Math.round((count / funnelMax) * 100);
                return (
                  <div key={step.key}>
                    <div className="mb-1 flex justify-between text-sm">
                      <span className="text-calm-800">{step.label}</span>
                      <span className="tabular-nums text-calm-600">{formatInt(count)}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-calm-100">
                      <div
                        className="h-full rounded-full bg-sage-500/80"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="mt-8 rounded-card border border-calm-200 bg-white p-4">
            <h2 className="text-sm font-semibold text-calm-900">Pageviews por dia</h2>
            {data.daily.length === 0 ? (
              <p className="mt-4 text-sm text-calm-600">Nenhum pageview no período.</p>
            ) : (
              <div className="mt-4 flex items-end gap-1.5 overflow-x-auto pb-1" style={{ minHeight: 140 }}>
                {data.daily.map((day) => {
                  const height = Math.max(4, Math.round((day.pageviews / maxDaily) * 100));
                  return (
                    <div
                      key={day.day}
                      className="flex w-8 shrink-0 flex-col items-center gap-1"
                      title={`${formatDay(day.day)}: ${day.pageviews} pageviews, ${day.visitors} visitantes`}
                    >
                      <span className="text-[10px] tabular-nums text-calm-500">
                        {day.pageviews || ""}
                      </span>
                      <div
                        className="w-full rounded-t bg-brand-600/70"
                        style={{ height: `${height}px` }}
                      />
                      <span className="text-[9px] text-calm-500">{formatDay(day.day)}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <CountTable
              title="Páginas mais vistas"
              empty="Nenhuma página registrada."
              labelKey="Path"
              rows={data.top_paths.map((r) => ({ label: r.path, count: r.count }))}
            />
            <CountTable
              title="De onde vieram (referrer)"
              empty="Nenhum referrer registrado."
              labelKey="Origem"
              rows={data.top_referrers.map((r) => ({ label: r.referrer, count: r.count }))}
            />
            <CountTable
              title="UTM source"
              empty="Nenhuma campanha UTM."
              labelKey="Source"
              rows={data.top_utm_sources.map((r) => ({ label: r.utm_source, count: r.count }))}
            />
            <CountTable
              title="UTM campaign"
              empty="Nenhuma campanha UTM."
              labelKey="Campaign"
              rows={data.top_utm_campaigns.map((r) => ({
                label: r.utm_campaign,
                count: r.count,
              }))}
            />
          </div>

          <section className="mt-8 rounded-card border border-calm-200 bg-white p-4">
            <h2 className="text-sm font-semibold text-calm-900">Dispositivos</h2>
            {data.devices.length === 0 ? (
              <p className="mt-4 text-sm text-calm-600">Sem dados de dispositivo.</p>
            ) : (
              <div className="mt-4 flex flex-col gap-3">
                {data.devices.map((d) => {
                  const pct = deviceTotal
                    ? Math.round((d.count / deviceTotal) * 100)
                    : 0;
                  return (
                    <div key={d.device_type}>
                      <div className="mb-1 flex justify-between text-sm">
                        <span className="text-calm-800">{deviceLabel(d.device_type)}</span>
                        <span className="tabular-nums text-calm-600">
                          {formatInt(d.count)} ({pct}%)
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-calm-100">
                        <div
                          className="h-full rounded-full bg-brand-600/60"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </>
      )}
    </main>
  );
}

export default function AdminMetricasPage() {
  return (
    <AdminGate>
      <MetricsDashboard />
    </AdminGate>
  );
}
