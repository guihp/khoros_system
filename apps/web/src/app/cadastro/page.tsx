"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase/client";
import { fetchApi, ApiError } from "@/lib/api";
import { writePendingRegistration } from "@/lib/pending-registration";
import { postRegisterRedirectPath, roleHomePath } from "@/lib/complete-registration";

// ADMIN é cadastro via BOOTSTRAP_ADMIN_EMAIL (ver auth/routes.ts) — sem UI própria aqui.
type Role = "PATIENT" | "PSYCHOLOGIST";

export default function CadastroPage() {
  const router = useRouter();
  const { session, user, me, loading: authLoading, refresh } = useAuth();
  // Auth já existe (ex.: confirmou e-mail e entrou), mas ainda falta o perfil de domínio.
  const alreadyLoggedIn = Boolean(session) && me?.registered === false;

  const [role, setRole] = useState<Role>("PATIENT");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [publicNickname, setPublicNickname] = useState("");
  const [dataNascimento, setDataNascimento] = useState("");
  const [cidade, setCidade] = useState("");
  const [crpNumero, setCrpNumero] = useState("");
  const [crpRegiao, setCrpRegiao] = useState("");
  const [precoPorMinuto, setPrecoPorMinuto] = useState("2,00");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Se já tem perfil completo, não faz sentido estar aqui — manda para a home do papel.
  useEffect(() => {
    if (me?.registered) router.replace(roleHomePath(me.role));
  }, [me, router]);

  useEffect(() => {
    if (alreadyLoggedIn && user?.email) setEmail(user.email);
  }, [alreadyLoggedIn, user?.email]);

  function buildPayload() {
    if (role === "PATIENT") {
      return {
        role,
        fullName,
        nickname: publicNickname || undefined,
        birthDate: dataNascimento || undefined,
        city: cidade || undefined,
      };
    }
    return {
      role,
      fullName,
      city: cidade || undefined,
      crpNumero,
      crpRegiao,
      precoPorMinutoCentavos: Math.round(parseFloat(precoPorMinuto.replace(",", ".")) * 100),
    };
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setLoading(true);

    try {
      const payload = buildPayload();

      // Já logado sem perfil (ex.: Auth criado, mas /auth/register nunca rodou).
      if (alreadyLoggedIn && session?.access_token) {
        await fetchApi("/auth/register", {
          method: "POST",
          token: session.access_token,
          body: payload,
        });
        await refresh();
        router.push(postRegisterRedirectPath(role));
        return;
      }

      const supabase = createClient();
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { khoros_register: payload } },
      });
      if (signUpError) {
        setError(signUpError.message);
        setLoading(false);
        return;
      }

      // Backup local por e-mail — cobre o caso raro de o metadata do Auth não
      // sobreviver (ex.: confirmação de e-mail neste mesmo navegador).
      writePendingRegistration(email, payload);

      let token = data.session?.access_token;
      if (!token) {
        const { data: sessionData } = await supabase.auth.getSession();
        token = sessionData.session?.access_token;
      }

      if (!token) {
        setNotice(
          "Conta criada. Verifique seu e-mail para confirmar o cadastro. Ao entrar depois — em qualquer navegador — concluímos seu perfil automaticamente.",
        );
        setLoading(false);
        return;
      }

      await fetchApi("/auth/register", { method: "POST", token, body: payload });
      await refresh();
      router.push(postRegisterRedirectPath(role));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível concluir o cadastro.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-sm px-4 py-16">
      <h1 className="text-2xl font-semibold text-calm-900">Criar conta</h1>
      {alreadyLoggedIn ? (
        <p className="mt-2 text-sm text-calm-600">
          Sua conta já existe — falta só completar seu perfil na KHOROS.
        </p>
      ) : (
        <p className="mt-2 text-sm text-calm-600">Comece em poucos passos.</p>
      )}

      <div
        role="tablist"
        aria-label="Tipo de conta"
        className="mt-6 grid grid-cols-2 rounded-full bg-calm-100 p-1"
      >
        <button
          type="button"
          role="tab"
          aria-selected={role === "PATIENT"}
          onClick={() => setRole("PATIENT")}
          className={`rounded-full px-4 py-2 text-sm font-medium transition ${
            role === "PATIENT" ? "bg-white text-brand-700 shadow-sm" : "text-calm-600"
          }`}
        >
          Paciente
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={role === "PSYCHOLOGIST"}
          onClick={() => setRole("PSYCHOLOGIST")}
          className={`rounded-full px-4 py-2 text-sm font-medium transition ${
            role === "PSYCHOLOGIST" ? "bg-white text-brand-700 shadow-sm" : "text-calm-600"
          }`}
        >
          Psicólogo
        </button>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-calm-800">Nome completo</span>
          <input
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="rounded-md border border-calm-200 px-3 py-2.5 text-calm-900 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-200"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-calm-800">E-mail</span>
          <input
            type="email"
            required={!alreadyLoggedIn}
            readOnly={alreadyLoggedIn}
            disabled={alreadyLoggedIn && authLoading}
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={`rounded-md border px-3 py-2.5 text-calm-900 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-200 ${
              alreadyLoggedIn ? "border-calm-100 bg-calm-50 text-calm-600" : "border-calm-200"
            }`}
          />
        </label>

        {!alreadyLoggedIn && (
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-calm-800">Senha</span>
            <input
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-md border border-calm-200 px-3 py-2.5 text-calm-900 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-200"
            />
          </label>
        )}

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-calm-800">Cidade</span>
          <input
            value={cidade}
            onChange={(e) => setCidade(e.target.value)}
            className="rounded-md border border-calm-200 px-3 py-2.5 text-calm-900 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-200"
          />
        </label>

        {role === "PATIENT" ? (
          <>
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-calm-800">
                Nome público (opcional) <span className="text-calm-400">— visível ao psicólogo</span>
              </span>
              <input
                value={publicNickname}
                onChange={(e) => setPublicNickname(e.target.value)}
                className="rounded-md border border-calm-200 px-3 py-2.5 text-calm-900 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-200"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-calm-800">Data de nascimento</span>
              <input
                type="date"
                required
                value={dataNascimento}
                onChange={(e) => setDataNascimento(e.target.value)}
                className="rounded-md border border-calm-200 px-3 py-2.5 text-calm-900 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-200"
              />
              <span className="text-xs text-calm-600">
                Se você for menor de idade, vamos pedir o consentimento de um responsável legal
                no próximo passo.
              </span>
            </label>
          </>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-calm-800">Número CRP</span>
                <input
                  required
                  placeholder="123456"
                  value={crpNumero}
                  onChange={(e) => setCrpNumero(e.target.value)}
                  className="rounded-md border border-calm-200 px-3 py-2.5 text-calm-900 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-200"
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-calm-800">Região</span>
                <input
                  required
                  placeholder="06"
                  value={crpRegiao}
                  onChange={(e) => setCrpRegiao(e.target.value)}
                  className="rounded-md border border-calm-200 px-3 py-2.5 text-calm-900 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-200"
                />
              </label>
            </div>
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-calm-800">Preço por minuto (R$)</span>
              <input
                required
                inputMode="decimal"
                value={precoPorMinuto}
                onChange={(e) => setPrecoPorMinuto(e.target.value)}
                className="rounded-md border border-calm-200 px-3 py-2.5 text-calm-900 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-200"
              />
            </label>
            <p className="text-xs text-calm-600">
              Sua inscrição no CRP será validada por um administrador antes de você poder
              atender.
            </p>
          </>
        )}

        {error && (
          <p role="alert" className="text-sm text-red-700">
            {error}
          </p>
        )}
        {notice && (
          <p role="status" className="text-sm text-sage-600">
            {notice}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="mt-2 rounded-full bg-brand-600 px-6 py-3 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
        >
          {loading ? "Criando conta…" : alreadyLoggedIn ? "Completar cadastro" : "Criar conta"}
        </button>
      </form>

      {!alreadyLoggedIn && (
        <p className="mt-6 text-center text-sm text-calm-600">
          Já tem conta?{" "}
          <Link href="/entrar" className="text-brand-700 underline hover:text-brand-800">
            Entrar
          </Link>
        </p>
      )}
    </main>
  );
}
