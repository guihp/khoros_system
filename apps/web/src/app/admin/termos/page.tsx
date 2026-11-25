"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AdminGate, useAdminToken } from "@/components/admin/AdminGate";
import { TermText } from "@/components/TermText";
import { fetchApi, ApiError } from "@/lib/api";
import type { AdminTermItem } from "@/lib/api-types";

const LABELS: Record<AdminTermItem["tipo"], { title: string; hint: string }> = {
  TERMO_CONSENTIMENTO: {
    title: "Termo de Consentimento Livre e Esclarecido (TCLE)",
    hint: "Atendimento psicológico online (Resolução CFP nº 09/2024).",
  },
  LGPD: {
    title: "Privacidade e proteção de dados (LGPD)",
    hint: "Como os dados de saúde são tratados e protegidos.",
  },
};

function TermEditor({ item, token, onSaved }: { item: AdminTermItem; token: string; onSaved: (i: AdminTermItem) => void }) {
  const [texto, setTexto] = useState(item.texto);
  const [exigirReaceite, setExigirReaceite] = useState(true);
  const [preview, setPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const dirty = texto.trim() !== item.texto.trim();

  async function save(forceNewVersion = false) {
    const reaceite = forceNewVersion || exigirReaceite;
    if (reaceite && !confirm("Todos os pacientes vão precisar aceitar este termo novamente antes da próxima consulta. Continuar?")) return;
    setSaving(true);
    setMsg(null);
    try {
      const saved = await fetchApi<AdminTermItem>("/admin/terms", {
        method: "PUT",
        token,
        body: { tipo: item.tipo, texto, exigirReaceite: reaceite },
      });
      onSaved(saved);
      setMsg({ ok: true, text: reaceite ? `Salvo. Nova versão ${saved.versao}: pacientes vão aceitar de novo.` : "Texto salvo (mesma versão)." });
    } catch (err) {
      setMsg({ ok: false, text: err instanceof ApiError ? err.message : "Não foi possível salvar." });
    } finally {
      setSaving(false);
    }
  }

  const label = LABELS[item.tipo];
  return (
    <section className="rounded-card border border-calm-200 bg-white p-5 shadow-soft">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold text-calm-900">{label.title}</h2>
          <p className="mt-0.5 text-sm text-calm-600">{label.hint}</p>
        </div>
        <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-800">
          Versão vigente: {item.versao || "—"}
        </span>
      </div>

      <div className="mt-4 flex gap-2 text-sm">
        <button type="button" onClick={() => setPreview(false)} className={`rounded-full px-3 py-1 ${!preview ? "bg-calm-100 font-medium text-calm-900" : "text-calm-600"}`}>
          Editar
        </button>
        <button type="button" onClick={() => setPreview(true)} className={`rounded-full px-3 py-1 ${preview ? "bg-calm-100 font-medium text-calm-900" : "text-calm-600"}`}>
          Como o paciente vê
        </button>
      </div>

      {preview ? (
        <div className="mt-3 rounded-xl border border-calm-200 bg-calm-50 p-4">
          <TermText text={texto} />
        </div>
      ) : (
        <>
          <textarea
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            rows={12}
            className="mt-3 w-full rounded-xl border border-calm-200 px-3 py-2.5 font-mono text-sm text-calm-900 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-200"
          />
          <p className="mt-1 text-xs text-calm-500">
            Separe parágrafos com uma linha em branco. Linhas que começam com &quot;- &quot; viram itens de lista.
          </p>
        </>
      )}

      <label className="mt-4 flex items-start gap-2 text-sm text-calm-800">
        <input type="checkbox" checked={exigirReaceite} onChange={(e) => setExigirReaceite(e.target.checked)} className="mt-0.5" />
        <span>
          Gerar nova versão e pedir que <strong>todos os pacientes aceitem novamente</strong>.
          <span className="block text-xs text-calm-500">Desmarque só para correções pequenas (erro de digitação) que não mudam o sentido do termo.</span>
        </span>
      </label>

      {msg && (
        <p role="status" className={`mt-3 text-sm ${msg.ok ? "text-brand-700" : "text-red-700"}`}>
          {msg.text}
        </p>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" disabled={saving || !dirty} onClick={() => save()} className="btn-primary !py-2 text-sm disabled:opacity-50">
          {saving ? "Salvando…" : "Salvar termo"}
        </button>
        {!dirty && (
          <button type="button" disabled={saving} onClick={() => save(true)} className="btn-secondary !py-2 text-sm">
            Pedir novo aceite sem alterar o texto
          </button>
        )}
      </div>
    </section>
  );
}

function TermsAdmin() {
  const token = useAdminToken();
  const [items, setItems] = useState<AdminTermItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      const data = await fetchApi<{ items: AdminTermItem[] }>("/admin/terms", { token });
      setItems(data.items);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível carregar os termos.");
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <Link href="/admin" className="text-sm text-brand-700 hover:underline">
        ← Administração
      </Link>
      <h1 className="mt-3 text-2xl font-semibold text-calm-900">Termos de consentimento</h1>
      <p className="mt-2 text-sm text-calm-600">
        Textos que o paciente lê e aceita antes da primeira consulta. Cada aceite fica registrado com data, hora e
        versão. Toda alteração fica no histórico de auditoria.
      </p>
      {error && <p role="alert" className="mt-6 text-sm text-red-700">{error}</p>}
      {!items && !error && <p className="mt-6 text-sm text-calm-600">Carregando…</p>}
      <div className="mt-6 flex flex-col gap-6">
        {items?.map((item) =>
          token ? (
            <TermEditor
              key={item.tipo}
              item={item}
              token={token}
              onSaved={(saved) => setItems((prev) => prev?.map((p) => (p.tipo === saved.tipo ? saved : p)) ?? null)}
            />
          ) : null,
        )}
      </div>
    </main>
  );
}

export default function AdminTermsPage() {
  return (
    <AdminGate>
      <TermsAdmin />
    </AdminGate>
  );
}
