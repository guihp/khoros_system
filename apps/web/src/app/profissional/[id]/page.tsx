"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { fetchApi, ApiError } from "@/lib/api";
import { roleHomePath } from "@/lib/complete-registration";
import type { ConsentStatusResponse, PsychologistPublicProfile } from "@/lib/api-types";
import { ProfissionalProfileView } from "@/components/profissional/ProfissionalProfileView";

export default function ProfissionalPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { session, me, loading: authLoading } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<PsychologistPublicProfile | null>(null);
  const [consentStatus, setConsentStatus] = useState<ConsentStatusResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (me?.registered && me.role !== "PATIENT") {
      router.replace(roleHomePath(me.role));
    }
  }, [authLoading, me, router]);

  useEffect(() => {
    if (authLoading) return;
    if (!session) {
      setLoading(false);
      setProfile(null);
      return;
    }
    if (me && me.registered === false) {
      setLoading(false);
      setProfile(null);
      return;
    }

    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const data = await fetchApi<PsychologistPublicProfile>(`/psychologists/${id}`, {
          token: session.access_token,
        });
        if (!cancelled) {
          setProfile(data);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setProfile(null);
          setError(err instanceof ApiError ? err.message : "Não foi possível carregar o perfil.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [session, authLoading, me, id]);

  useEffect(() => {
    if (!session?.access_token || me?.registered === false) {
      setConsentStatus(null);
      return;
    }
    fetchApi<ConsentStatusResponse>("/consents/status", { token: session.access_token })
      .then(setConsentStatus)
      .catch(() => setConsentStatus(null));
  }, [session, me]);

  function hasRequiredConsents(): boolean {
    if (!consentStatus) return false;
    return consentStatus.termoOk && consentStatus.lgpdOk && consentStatus.responsavelLegalOk;
  }

  function handleFalarAgora() {
    if (!session) {
      router.push("/entrar");
      return;
    }
    if (me && me.registered === false) {
      router.push("/cadastro");
      return;
    }
    setStarting(true);
    if (!hasRequiredConsents()) {
      router.push("/consentimentos");
      return;
    }
    router.push(`/triagem?psy=${id}`);
  }

  if (authLoading || loading) {
    return (
      <main className="atmosphere-panel min-h-[calc(100vh-4rem)]">
        <div className="mx-auto max-w-5xl px-4 py-10 text-calm-600">Carregando…</div>
      </main>
    );
  }

  if (!session) {
    return (
      <main className="atmosphere-panel min-h-[calc(100vh-4rem)]">
        <div className="mx-auto max-w-5xl px-4 py-10 text-center">
          <p className="text-calm-800">Entre na sua conta para ver o perfil do profissional.</p>
          <Link href="/entrar" className="mt-4 inline-block text-brand-700 underline">
            Entrar
          </Link>
        </div>
      </main>
    );
  }

  if (me && me.registered === false) {
    return (
      <main className="atmosphere-panel min-h-[calc(100vh-4rem)]">
        <div className="mx-auto max-w-5xl px-4 py-10 text-center">
          <p className="text-calm-800">Complete seu cadastro para ver profissionais.</p>
          <Link href="/cadastro" className="mt-4 inline-block text-brand-700 underline">
            Completar cadastro
          </Link>
        </div>
      </main>
    );
  }

  if (error || !profile) {
    return (
      <main className="atmosphere-panel min-h-[calc(100vh-4rem)]">
        <div className="mx-auto max-w-5xl px-4 py-10">
          <Link
            href="/paciente"
            className="inline-flex text-sm font-medium text-brand-700 underline hover:text-brand-800"
          >
            ← Voltar
          </Link>
          <p className="mt-6 text-sm text-red-700">{error ?? "Profissional não encontrado."}</p>
        </div>
      </main>
    );
  }

  return (
    <ProfissionalProfileView
      profile={profile}
      starting={starting}
      onFalarAgora={handleFalarAgora}
    />
  );
}
