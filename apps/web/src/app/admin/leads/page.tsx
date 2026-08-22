"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AdminGate, useAdminToken } from "@/components/admin/AdminGate";
import { fetchApi, ApiError } from "@/lib/api";
import type { AdminLeadsResponse, LeadEntry } from "@/lib/api-types";
import { formatBrazilMobileDisplay } from "@/lib/format-brazil-phone";

type SourceFilter = "" | "waitlist" | "article";

const PAGE_SIZE = 50;

const SOURCE_FILTERS: { value: SourceFilter; label: string }[] = [
  { value: "", label: "Todos" },
  { value: "waitlist", label: "Lista de espera" },
  { value: "article", label: "Artigos" },
];

function sourceLabel(source: string): string {
  if (source === "waitlist") return "Lista de espera";
  if (source === "article") return "Artigo";
  return source;
}

function articleInfo(lead: LeadEntry): string | null {
  if (lead.article_title) return lead.article_title;
  if (lead.article_slug) return `/${lead.article_slug}`;
  return null;
}

function formatPhone(phone: string | null): string {
  if (!phone) return "—";
  return formatBrazilMobileDisplay(phone);
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function LeadsList() {
  const token = useAdminToken();
  const [items, setItems] = useState<LeadEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>("");
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (nextOffset: number, append: boolean) => {
      if (!token) return;
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      setError(null);

      try {
        const params = new URLSearchParams({
          limit: String(PAGE_SIZE),
          offset: String(nextOffset),
        });
        if (sourceFilter) params.set("source", sourceFilter);

        const data = await fetchApi<AdminLeadsResponse>(`/admin/leads?${params}`, { token });

        setTotal(data.total);
        setOffset(nextOffset);
        setItems((prev) => (append ? [...prev, ...data.items] : data.items));
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Não foi possível carregar os leads.");
        if (!append) setItems([]);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [token, sourceFilter],
  );

  useEffect(() => {
    void load(0, false);
  }, [load]);

  const hasMore = items.length < total;

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <p className="text-sm text-calm-600">
        <Link href="/admin" className="hover:text-brand-700">
          Admin
        </Link>
        <span className="mx-1.5 text-calm-400">/</span>
        Leads
      </p>
      <h1 className="mt-2 text-2xl font-semibold text-calm-900">Lista de espera / Leads</h1>
      <p className="mt-2 text-sm text-calm-600">
        Contatos capturados pela waitlist e pelos formulários de artigos do blog.
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        {SOURCE_FILTERS.map((filter) => (
          <button
            key={filter.value || "all"}
            type="button"
            onClick={() => setSourceFilter(filter.value)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              sourceFilter === filter.value
                ? "bg-sage-600 text-white"
                : "border border-calm-200 bg-white text-calm-800 hover:bg-calm-100"
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {!loading && (
        <p className="mt-4 text-sm text-calm-600">
          {total === 0
            ? "Nenhum lead encontrado."
            : `${total} lead${total === 1 ? "" : "s"} no total${items.length < total ? ` · exibindo ${items.length}` : ""}`}
        </p>
      )}

      {error && <p className="mt-4 text-sm text-red-700">{error}</p>}

      {loading ? (
        <p className="mt-8 text-sm text-calm-600">Carregando…</p>
      ) : items.length === 0 ? (
        <p className="mt-8 rounded-card border border-calm-200 bg-white p-6 text-sm text-calm-600">
          Nenhum lead neste filtro. Os cadastros aparecerão aqui quando alguém se inscrever na lista de
          espera ou enviar um formulário em um artigo.
        </p>
      ) : (
        <>
          <div className="mt-6 hidden overflow-x-auto rounded-card border border-calm-200 bg-white md:block">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-calm-200 bg-calm-50/80 text-calm-700">
                <tr>
                  <th className="px-4 py-3 font-medium">Nome</th>
                  <th className="px-4 py-3 font-medium">E-mail</th>
                  <th className="px-4 py-3 font-medium">Celular</th>
                  <th className="px-4 py-3 font-medium">Origem</th>
                  <th className="px-4 py-3 font-medium">Artigo</th>
                  <th className="px-4 py-3 font-medium">Cadastro</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-calm-100">
                {items.map((lead) => (
                  <tr key={lead.id} className="text-calm-900">
                    <td className="px-4 py-3">{lead.name}</td>
                    <td className="px-4 py-3 text-calm-700">{lead.email}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-calm-700">{formatPhone(lead.phone)}</td>
                    <td className="px-4 py-3">{sourceLabel(lead.source)}</td>
                    <td className="px-4 py-3 text-calm-700">{articleInfo(lead) ?? "—"}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-calm-700">{formatDate(lead.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 flex flex-col gap-3 md:hidden">
            {items.map((lead) => (
              <div key={lead.id} className="rounded-card border border-calm-200 bg-white p-4">
                <p className="font-medium text-calm-900">{lead.name}</p>
                <p className="mt-1 text-sm text-calm-700">{lead.email}</p>
                <p className="mt-1 text-sm text-calm-700">{formatPhone(lead.phone)}</p>
                <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-calm-600">
                  <span>{sourceLabel(lead.source)}</span>
                  {articleInfo(lead) && <span>{articleInfo(lead)}</span>}
                  <span>{formatDate(lead.created_at)}</span>
                </div>
              </div>
            ))}
          </div>

          {hasMore && (
            <div className="mt-6 flex justify-center">
              <button
                type="button"
                disabled={loadingMore}
                onClick={() => void load(offset + PAGE_SIZE, true)}
                className="rounded-full border border-calm-200 bg-white px-5 py-2 text-sm font-medium text-calm-800 hover:bg-calm-100 disabled:opacity-60"
              >
                {loadingMore ? "Carregando…" : "Carregar mais"}
              </button>
            </div>
          )}
        </>
      )}
    </main>
  );
}

export default function AdminLeadsPage() {
  return (
    <AdminGate>
      <LeadsList />
    </AdminGate>
  );
}
