"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AdminGate, useAdminToken } from "@/components/admin/AdminGate";
import { fetchApi, ApiError } from "@/lib/api";
import type { PendingCrpEntry, PendingCrpResponse } from "@/lib/api-types";

function CrpQueue() {
  const token = useAdminToken();
  const [pending, setPending] = useState<PendingCrpEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actingId, setActingId] = useState<string | null>(null);

  const loadPending = useCallback(async () => {
    if (!token) return;
    try {
      const data = await fetchApi<PendingCrpResponse>("/admin/crp/pending", { token });
      setPending(data.items);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível carregar a fila de verificação.");
      setPending([]);
    }
  }, [token]);

  useEffect(() => {
    void loadPending();
  }, [loadPending]);

  async function handleDecision(userId: string, decision: "verify" | "reject") {
    if (!token) return;
    setActingId(userId);
    setError(null);
    try {
      await fetchApi(`/admin/crp/${userId}/${decision}`, {
        method: "POST",
        token,
      });
      setPending((prev) => prev?.filter((p) => p.user_id !== userId) ?? null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível registrar a decisão.");
    } finally {
      setActingId(null);
    }
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <p className="text-sm text-calm-600">
        <Link href="/admin" className="hover:text-brand-700">
          Admin
        </Link>
        <span className="mx-1.5 text-calm-400">/</span>
        CRP
      </p>
      <h1 className="mt-2 text-2xl font-semibold text-calm-900">Verificação de CRP</h1>
      <p className="mt-2 text-sm text-calm-600">
        Psicólogos abaixo aguardam confirmação da inscrição no CRP antes de poderem atender.
      </p>

      {error && <p className="mt-6 text-sm text-red-700">{error}</p>}

      {pending === null ? (
        <p className="mt-8 text-sm text-calm-600">Carregando…</p>
      ) : pending.length === 0 ? (
        <p className="mt-8 text-sm text-calm-600">Nenhuma verificação pendente.</p>
      ) : (
        <div className="mt-8 flex flex-col gap-4">
          {pending.map((p) => (
            <div
              key={p.user_id}
              className="flex flex-col gap-3 rounded-card border border-calm-200 bg-white p-5 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="text-base font-medium text-calm-900">{p.users?.full_name ?? "Psicólogo"}</p>
                <p className="text-sm text-calm-600">
                  CRP {p.crp_numero}/{p.crp_regiao}
                  {p.users?.email ? ` · ${p.users.email}` : ""}
                </p>
                {p.users?.created_at && (
                  <p className="text-xs text-calm-600">
                    Cadastrado em {new Date(p.users.created_at).toLocaleDateString("pt-BR")}
                  </p>
                )}
              </div>
              <div className="flex shrink-0 gap-2">
                <button
                  type="button"
                  disabled={actingId === p.user_id}
                  onClick={() => handleDecision(p.user_id, "verify")}
                  className="rounded-full bg-sage-600 px-4 py-2 text-sm font-medium text-white hover:bg-sage-600/90 disabled:opacity-60"
                >
                  Aprovar
                </button>
                <button
                  type="button"
                  disabled={actingId === p.user_id}
                  onClick={() => handleDecision(p.user_id, "reject")}
                  className="rounded-full border border-calm-200 px-4 py-2 text-sm font-medium text-calm-800 hover:bg-calm-100 disabled:opacity-60"
                >
                  Rejeitar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}

export default function AdminCrpPage() {
  return (
    <AdminGate>
      <CrpQueue />
    </AdminGate>
  );
}
