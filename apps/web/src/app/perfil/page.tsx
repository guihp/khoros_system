"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AVATAR_MAX_BYTES, BIO_MAX_LENGTH, formatBRL } from "@khoros/shared";
import { useAuth } from "@/lib/auth-context";
import { fetchApi, uploadApiFile, ApiError } from "@/lib/api";
import type { AvatarUploadResponse, PatientProfileApi, PsychologistProfileApi } from "@/lib/api-types";
import { PatientPerfilView } from "@/components/paciente/PatientPerfilView";

export default function PerfilPage() {
  const { session, me, loading: authLoading, refresh } = useAuth();

  if (authLoading) {
    return <main className="mx-auto max-w-lg px-4 py-16 text-calm-600">Carregando…</main>;
  }

  if (!session) {
    return (
      <main className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="text-calm-800">Entre na sua conta para ver seu perfil.</p>
        <Link href="/entrar" className="mt-4 inline-block text-brand-700 underline">
          Ir para o login
        </Link>
      </main>
    );
  }

  if (!me?.registered) {
    return (
      <main className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="text-calm-800">Complete seu cadastro para configurar seu perfil.</p>
        <Link href="/cadastro" className="mt-4 inline-block text-brand-700 underline">
          Completar cadastro
        </Link>
      </main>
    );
  }

  const isPsychologist = me.role === "PSYCHOLOGIST";
  const isPatient = me.role === "PATIENT";

  if (isPatient) {
    return (
      <main className="atmosphere-panel min-h-[calc(100vh-4rem)]">
        <div className="mx-auto max-w-5xl px-4 py-10 sm:py-12">
          <PatientPerfilView
            token={session.access_token}
            email={me.email}
            fullName={me.full_name}
            nickname={me.public_nickname}
            profile={(me.profile as PatientProfileApi | undefined) ?? null}
            onSaved={refresh}
          />
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <header className="mb-8">
        <h1 className="font-display text-2xl tracking-tight text-calm-900 sm:text-3xl">
          {isPsychologist ? "Perfil profissional" : "Seu perfil"}
        </h1>
        <p className="mt-1.5 text-sm text-calm-600">{me.email}</p>
        {isPsychologist && (
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-calm-600">
            Atualize como você aparece para pacientes. O preview à esquerda reflete as alterações
            antes de salvar.
          </p>
        )}
      </header>

      {isPsychologist && (
        <PsychologistProfileForm
          token={session.access_token}
          userId={me.id}
          fullName={me.full_name}
          profile={(me.profile as PsychologistProfileApi | undefined) ?? null}
          onSaved={refresh}
        />
      )}

      {me.role === "ADMIN" && (
        <div className="mt-6 rounded-card border border-calm-200 bg-white p-5">
          <p className="text-sm font-medium text-calm-900">{me.full_name}</p>
          <p className="mt-1 text-sm text-calm-600">
            Conta de administrador — sem campos editáveis aqui.
          </p>
        </div>
      )}
    </main>
  );
}

function psychologistInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ""}${parts[parts.length - 1]![0] ?? ""}`.toUpperCase();
}

function splitList(value: string): string[] {
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function parsePrecoCentavos(preco: string): number | null {
  const n = Math.round(parseFloat(preco.replace(",", ".")) * 100);
  if (!n || Number.isNaN(n)) return null;
  return n;
}

function PsychologistProfileForm({
  token,
  userId,
  fullName,
  profile,
  onSaved,
}: {
  token: string;
  userId: string;
  fullName: string;
  profile: PsychologistProfileApi | null;
  onSaved: () => Promise<void>;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [bio, setBio] = useState(profile?.bio ?? "");
  const [abordagens, setAbordagens] = useState((profile?.abordagens ?? []).join(", "));
  const [especialidades, setEspecialidades] = useState((profile?.especialidades ?? []).join(", "));
  const [preco, setPreco] = useState(
    profile ? (profile.preco_por_minuto_centavos / 100).toFixed(2).replace(".", ",") : "2,00",
  );
  const [fotoUrl, setFotoUrl] = useState(profile?.foto_url ?? null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => setBio(profile?.bio ?? ""), [profile?.bio]);
  useEffect(() => setAbordagens((profile?.abordagens ?? []).join(", ")), [profile?.abordagens]);
  useEffect(
    () => setEspecialidades((profile?.especialidades ?? []).join(", ")),
    [profile?.especialidades],
  );
  useEffect(() => {
    if (profile) setPreco((profile.preco_por_minuto_centavos / 100).toFixed(2).replace(".", ","));
  }, [profile?.preco_por_minuto_centavos]);
  useEffect(() => setFotoUrl(profile?.foto_url ?? null), [profile?.foto_url]);

  const abordagensList = splitList(abordagens);
  const especialidadesList = splitList(especialidades);
  const previewPreco =
    parsePrecoCentavos(preco) ?? profile?.preco_por_minuto_centavos ?? 200;
  const crpVerified = profile?.crp_status === "VERIFIED";
  const bioOverLimit = bio.length > BIO_MAX_LENGTH;

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Use uma imagem JPEG, PNG ou WebP.");
      return;
    }
    if (file.size > AVATAR_MAX_BYTES) {
      setError("A imagem deve ter no máximo 2 MB.");
      return;
    }

    setError(null);
    setNotice(null);
    setUploading(true);
    try {
      const result = await uploadApiFile<AvatarUploadResponse>("/pro/avatar", file, token);
      setFotoUrl(result.foto_url);
      await onSaved();
      setNotice("Foto atualizada com sucesso.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível enviar a foto.");
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);

    if (bioOverLimit) {
      setError(`A bio pode ter no máximo ${BIO_MAX_LENGTH} caracteres.`);
      return;
    }

    const precoCentavos = parsePrecoCentavos(preco);
    if (precoCentavos === null) {
      setError("Informe um preço por minuto válido.");
      return;
    }

    setSaving(true);
    try {
      await fetchApi("/pro/profile", {
        method: "PATCH",
        token,
        body: {
          bio: bio || undefined,
          abordagens: abordagensList,
          especialidades: especialidadesList,
          precoPorMinutoCentavos: precoCentavos,
        },
      });
      await onSaved();
      setNotice("Perfil profissional salvo. As alterações já estão no seu card público.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível salvar seu perfil.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)] lg:items-start xl:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
      {/* Public card preview */}
      <aside className="lg:sticky lg:top-24">
        <p className="mb-3 text-xs font-medium uppercase tracking-wide text-calm-600">
          Como pacientes veem
        </p>
        <article className="overflow-hidden rounded-card border border-calm-200 bg-white shadow-sm">
          <div className="atmosphere-panel relative aspect-[4/3] w-full overflow-hidden">
            {fotoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={fotoUrl}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <span
                  aria-hidden
                  className="flex h-24 w-24 items-center justify-center rounded-full bg-white/85 text-2xl font-semibold text-brand-700 shadow-sm ring-1 ring-brand-100"
                >
                  {psychologistInitials(fullName)}
                </span>
              </div>
            )}
          </div>

          <div className="p-5">
            <h2 className="font-display text-xl tracking-tight text-calm-900">{fullName}</h2>

            {profile && (
              <div className="mt-2.5 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center rounded-full border border-calm-200 bg-calm-50 px-2.5 py-0.5 text-xs font-medium text-calm-800">
                  CRP {profile.crp_numero}/{profile.crp_regiao}
                </span>
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    crpVerified
                      ? "bg-sage-100 text-sage-600"
                      : "bg-warn-100 text-warn-700"
                  }`}
                >
                  {crpVerified ? "CRP verificado" : "CRP em verificação"}
                </span>
              </div>
            )}

            <p className="mt-3 text-base font-medium text-calm-900">
              {formatBRL(previewPreco)}
              <span className="font-normal text-calm-600">/min</span>
            </p>

            {bio.trim() ? (
              <p className="mt-3 line-clamp-4 whitespace-pre-wrap text-sm leading-relaxed text-calm-600">
                {bio}
              </p>
            ) : (
              <p className="mt-3 text-sm italic text-calm-400">
                Sua bio aparecerá aqui para os pacientes.
              </p>
            )}

            {(abordagensList.length > 0 || especialidadesList.length > 0) && (
              <div className="mt-4 space-y-3">
                {abordagensList.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-calm-600">Abordagens</p>
                    <ul className="mt-1.5 flex flex-wrap gap-1.5">
                      {abordagensList.map((tag) => (
                        <li
                          key={`ab-${tag}`}
                          className="rounded-full border border-brand-100 bg-brand-50 px-2.5 py-0.5 text-xs text-brand-800"
                        >
                          {tag}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {especialidadesList.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-calm-600">Especialidades</p>
                    <ul className="mt-1.5 flex flex-wrap gap-1.5">
                      {especialidadesList.map((tag) => (
                        <li
                          key={`esp-${tag}`}
                          className="rounded-full border border-calm-200 bg-calm-50 px-2.5 py-0.5 text-xs text-calm-800"
                        >
                          {tag}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            <Link
              href={`/profissional/${userId}`}
              className="mt-5 inline-block text-sm font-medium text-brand-700 underline hover:text-brand-800"
            >
              Ver perfil público
            </Link>
          </div>
        </article>
      </aside>

      {/* Edit form */}
      <section className="rounded-card border border-calm-200 bg-white p-5 sm:p-6">
        <h2 className="font-display text-lg tracking-tight text-calm-900">Editar perfil</h2>
        <p className="mt-1 text-sm text-calm-600">
          Foto, bio, abordagens, especialidades e preço por minuto.
        </p>

        <div className="mt-6 flex flex-col gap-5 sm:flex-row sm:items-center">
          {fotoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={fotoUrl}
              alt="Sua foto de perfil"
              className="h-28 w-28 shrink-0 rounded-full object-cover ring-2 ring-brand-100 sm:h-32 sm:w-32"
            />
          ) : (
            <div
              aria-hidden
              className="flex h-28 w-28 shrink-0 items-center justify-center rounded-full bg-brand-50 text-2xl font-semibold text-brand-700 ring-2 ring-brand-100 sm:h-32 sm:w-32"
            >
              {psychologistInitials(fullName)}
            </div>
          )}
          <div>
            <button
              type="button"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
              className="rounded-full border border-calm-200 bg-white px-4 py-2.5 text-sm font-medium text-calm-800 hover:border-calm-300 hover:bg-calm-50 disabled:opacity-60"
            >
              {uploading ? "Enviando…" : fotoUrl ? "Trocar foto" : "Adicionar foto"}
            </button>
            <p className="mt-2 text-xs leading-relaxed text-calm-600">
              JPEG, PNG ou WebP · até 2 MB. A foto é enviada na hora.
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              onChange={handleAvatarChange}
            />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-5">
          <label className="flex flex-col gap-1.5">
            <span className="flex items-baseline justify-between gap-2 text-sm font-medium text-calm-800">
              Bio
              <span
                className={`text-xs font-normal tabular-nums ${
                  bioOverLimit ? "text-red-700" : bio.length > BIO_MAX_LENGTH * 0.9 ? "text-warn-700" : "text-calm-500"
                }`}
              >
                {bio.length}/{BIO_MAX_LENGTH}
              </span>
            </span>
            <textarea
              rows={5}
              maxLength={BIO_MAX_LENGTH}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Conte brevemente sua formação e como você acompanha as pessoas…"
              className="rounded-md border border-calm-200 px-3 py-2.5 text-calm-900 outline-none placeholder:text-calm-400 focus:border-brand-400 focus:ring-2 focus:ring-brand-200"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-calm-800">
              Abordagens{" "}
              <span className="font-normal text-calm-400">— separadas por vírgula</span>
            </span>
            <input
              value={abordagens}
              onChange={(e) => setAbordagens(e.target.value)}
              placeholder="TCC, Psicanálise"
              className="rounded-md border border-calm-200 px-3 py-2.5 text-calm-900 outline-none placeholder:text-calm-400 focus:border-brand-400 focus:ring-2 focus:ring-brand-200"
            />
            {abordagensList.length > 0 && (
              <ul className="mt-1 flex flex-wrap gap-1.5" aria-hidden>
                {abordagensList.map((tag) => (
                  <li
                    key={`form-ab-${tag}`}
                    className="rounded-full border border-brand-100 bg-brand-50 px-2.5 py-0.5 text-xs text-brand-800"
                  >
                    {tag}
                  </li>
                ))}
              </ul>
            )}
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-calm-800">
              Especialidades{" "}
              <span className="font-normal text-calm-400">— separadas por vírgula</span>
            </span>
            <input
              value={especialidades}
              onChange={(e) => setEspecialidades(e.target.value)}
              placeholder="Ansiedade, Luto"
              className="rounded-md border border-calm-200 px-3 py-2.5 text-calm-900 outline-none placeholder:text-calm-400 focus:border-brand-400 focus:ring-2 focus:ring-brand-200"
            />
            {especialidadesList.length > 0 && (
              <ul className="mt-1 flex flex-wrap gap-1.5" aria-hidden>
                {especialidadesList.map((tag) => (
                  <li
                    key={`form-esp-${tag}`}
                    className="rounded-full border border-calm-200 bg-calm-50 px-2.5 py-0.5 text-xs text-calm-800"
                  >
                    {tag}
                  </li>
                ))}
              </ul>
            )}
          </label>

          <label className="flex max-w-xs flex-col gap-1.5">
            <span className="text-sm font-medium text-calm-800">Preço por minuto (R$)</span>
            <input
              inputMode="decimal"
              value={preco}
              onChange={(e) => setPreco(e.target.value)}
              className="rounded-md border border-calm-200 px-3 py-2.5 text-calm-900 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-200"
            />
            {profile && (
              <span className="text-xs text-calm-600">
                Salvo: {formatBRL(profile.preco_por_minuto_centavos)}/min
              </span>
            )}
          </label>

          {error && (
            <p role="alert" className="rounded-md bg-red-50 px-3 py-2.5 text-sm text-red-700">
              {error}
            </p>
          )}
          {notice && (
            <p
              role="status"
              className="rounded-md border border-sage-100 bg-sage-100/70 px-3 py-2.5 text-sm font-medium text-sage-600"
            >
              {notice}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              type="submit"
              disabled={saving}
              className="rounded-full bg-brand-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
            >
              {saving ? "Salvando…" : "Salvar alterações"}
            </button>
            <Link
              href="/pro"
              className="text-sm font-medium text-calm-600 underline hover:text-calm-800"
            >
              Voltar ao painel
            </Link>
          </div>
        </form>
      </section>
    </div>
  );
}
