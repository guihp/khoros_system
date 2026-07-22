"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase/client";
import { fetchApi } from "@/lib/api";
import { roleHomePath } from "@/lib/complete-registration";
import type { MeResponse } from "@/lib/api-types";

export default function EntrarPage() {
  const { signIn, refresh } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await signIn(email, password);
    if (error) {
      setLoading(false);
      setError("E-mail ou senha inválidos. Tente novamente.");
      return;
    }

    // `refresh()` já dispara a tentativa de auto-completar um cadastro pendente
    // (ver AuthProvider) e redireciona para /consentimentos ou /pro nesse caso.
    await refresh();

    const supabase = createClient();
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    if (!token) {
      setLoading(false);
      router.push("/");
      return;
    }

    try {
      const me = await fetchApi<MeResponse>("/me", { token });
      setLoading(false);
      if (!me.registered) {
        router.push("/cadastro");
        return;
      }
      router.push(roleHomePath(me.role));
    } catch {
      setLoading(false);
      router.push("/");
    }
  }

  return (
    <main className="mx-auto max-w-sm px-4 py-16">
      <h1 className="text-2xl font-semibold text-calm-900">Entrar</h1>
      <p className="mt-2 text-sm text-calm-600">
        Acesse sua conta para continuar sua conversa.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-calm-800">E-mail</span>
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-md border border-calm-200 px-3 py-2.5 text-calm-900 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-200"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-calm-800">Senha</span>
          <input
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-md border border-calm-200 px-3 py-2.5 text-calm-900 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-200"
          />
        </label>

        {error && (
          <p role="alert" className="text-sm text-red-700">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="mt-2 rounded-full bg-brand-600 px-6 py-3 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
        >
          {loading ? "Entrando…" : "Entrar"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-calm-600">
        Ainda não tem conta?{" "}
        <Link href="/cadastro" className="text-brand-700 underline hover:text-brand-800">
          Criar conta
        </Link>
      </p>
    </main>
  );
}
