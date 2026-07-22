"use client";

import { useEffect, useRef, useState } from "react";
import { AVATAR_MAX_BYTES, BIO_MAX_LENGTH } from "@khoros/shared";
import { fetchApi, uploadApiFile, ApiError } from "@/lib/api";
import type { AvatarUploadResponse, PatientProfileApi } from "@/lib/api-types";
import { patientInitials } from "./format-patient";

function PrefToggle({
  checked,
  onChange,
  label,
  description,
  id,
}: {
  id: string;
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  description: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-lg border border-calm-100 bg-calm-50/40 px-4 py-3.5">
      <div className="min-w-0">
        <label htmlFor={id} className="text-sm font-medium text-calm-900">
          {label}
        </label>
        <p className="mt-0.5 text-xs leading-relaxed text-calm-600">{description}</p>
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative mt-0.5 h-7 w-12 shrink-0 rounded-full transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-400 ${
          checked ? "bg-brand-600" : "bg-calm-200"
        }`}
      >
        <span
          aria-hidden
          className={`absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow-sm transition-transform ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}

interface PatientProfileEditorProps {
  token: string;
  fullName: string;
  nickname: string | null;
  profile: PatientProfileApi | null;
  onSaved: () => Promise<void>;
}

export function PatientProfileEditor({
  token,
  fullName,
  nickname,
  profile,
  onSaved,
}: PatientProfileEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(fullName);
  const [nick, setNick] = useState(nickname ?? "");
  const [city, setCity] = useState(profile?.cidade ?? "");
  const [bio, setBio] = useState(profile?.bio ?? "");
  const [mostrarNomeReal, setMostrarNomeReal] = useState(profile?.mostrar_nome_real ?? false);
  const [cameraLigada, setCameraLigada] = useState(profile?.camera_ligada_padrao ?? true);
  const [fotoUrl, setFotoUrl] = useState(profile?.foto_url ?? null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => setName(fullName), [fullName]);
  useEffect(() => setNick(nickname ?? ""), [nickname]);
  useEffect(() => setCity(profile?.cidade ?? ""), [profile?.cidade]);
  useEffect(() => setBio(profile?.bio ?? ""), [profile?.bio]);
  useEffect(
    () => setMostrarNomeReal(profile?.mostrar_nome_real ?? false),
    [profile?.mostrar_nome_real],
  );
  useEffect(
    () => setCameraLigada(profile?.camera_ligada_padrao ?? true),
    [profile?.camera_ligada_padrao],
  );
  useEffect(() => setFotoUrl(profile?.foto_url ?? null), [profile?.foto_url]);

  const bioOverLimit = bio.length > BIO_MAX_LENGTH;
  const displayName = mostrarNomeReal
    ? name.trim() || fullName
    : nick.trim() || nickname || "Seu nickname";
  const displayHint = mostrarNomeReal ? "Nome completo na consulta" : "Nickname público na consulta";

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
      const result = await uploadApiFile<AvatarUploadResponse>("/me/avatar", file, token);
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

    setSaving(true);
    try {
      await fetchApi("/me/profile", {
        method: "PATCH",
        token,
        body: {
          fullName: name || undefined,
          nickname: nick || undefined,
          city: city || undefined,
          bio: bio,
          mostrarNomeReal,
          cameraLigadaPadrao: cameraLigada,
        },
      });
      await onSaved();
      setNotice("Perfil atualizado.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível salvar seu perfil.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)] lg:items-start xl:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
      <aside className="lg:sticky lg:top-24">
        <p className="mb-3 text-xs font-medium uppercase tracking-wide text-calm-600">
          Como o psicólogo vê
        </p>
        <article className="overflow-hidden rounded-card border border-calm-200 bg-white shadow-sm">
          <div className="atmosphere-panel relative flex aspect-[4/3] w-full items-center justify-center overflow-hidden">
            {fotoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={fotoUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <span
                aria-hidden
                className="flex h-24 w-24 items-center justify-center rounded-full bg-white/85 text-2xl font-semibold text-brand-700 shadow-sm ring-1 ring-brand-100"
              >
                {patientInitials(name || fullName)}
              </span>
            )}
          </div>
          <div className="p-5">
            <h2 className="font-display text-xl tracking-tight text-calm-900">{displayName}</h2>
            <p className="mt-1 text-xs text-calm-600">{displayHint}</p>
            {city.trim() ? (
              <p className="mt-2 text-sm text-calm-700">{city.trim()}</p>
            ) : null}
            {bio.trim() ? (
              <p className="mt-3 line-clamp-4 whitespace-pre-wrap text-sm leading-relaxed text-calm-600">
                {bio}
              </p>
            ) : (
              <p className="mt-3 text-sm italic text-calm-400">
                Uma breve bio ajuda o profissional a te conhecer.
              </p>
            )}
            <ul className="mt-4 space-y-1.5 text-xs text-calm-600">
              <li>
                Câmera ao entrar:{" "}
                <span className="font-medium text-calm-800">
                  {cameraLigada ? "ligada" : "desligada"}
                </span>
              </li>
            </ul>
          </div>
        </article>
      </aside>

      <section className="rounded-card border border-calm-200 bg-white p-5 sm:p-6">
        <h2 className="font-display text-lg tracking-tight text-calm-900">Editar perfil</h2>
        <p className="mt-1 text-sm text-calm-600">
          Foto, nome, preferências de privacidade e como a câmera inicia na consulta.
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
              {patientInitials(name || fullName)}
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
            <span className="text-sm font-medium text-calm-800">Nome completo</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rounded-md border border-calm-200 px-3 py-2.5 text-calm-900 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-200"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-calm-800">
              Nickname{" "}
              <span className="font-normal text-calm-400">— nome público padrão</span>
            </span>
            <input
              value={nick}
              onChange={(e) => setNick(e.target.value)}
              className="rounded-md border border-calm-200 px-3 py-2.5 text-calm-900 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-200"
            />
          </label>

          <PrefToggle
            id="mostrar-nome-real"
            checked={mostrarNomeReal}
            onChange={setMostrarNomeReal}
            label="Usar nome real na consulta"
            description="Se ativo, o psicólogo vê seu nome completo em vez do nickname."
          />

          <label className="flex flex-col gap-1.5">
            <span className="flex items-baseline justify-between gap-2 text-sm font-medium text-calm-800">
              Bio
              <span
                className={`text-xs font-normal tabular-nums ${
                  bioOverLimit
                    ? "text-red-700"
                    : bio.length > BIO_MAX_LENGTH * 0.9
                      ? "text-warn-700"
                      : "text-calm-500"
                }`}
              >
                {bio.length}/{BIO_MAX_LENGTH}
              </span>
            </span>
            <textarea
              rows={4}
              maxLength={BIO_MAX_LENGTH}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Opcional — algo breve que o profissional possa ler antes da consulta…"
              className="rounded-md border border-calm-200 px-3 py-2.5 text-calm-900 outline-none placeholder:text-calm-400 focus:border-brand-400 focus:ring-2 focus:ring-brand-200"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-calm-800">Cidade</span>
            <input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="rounded-md border border-calm-200 px-3 py-2.5 text-calm-900 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-200"
            />
          </label>

          <PrefToggle
            id="camera-ligada"
            checked={cameraLigada}
            onChange={setCameraLigada}
            label="Câmera ligada ao entrar"
            description="Inicia a consulta com a câmera ligada. Você pode mudar a qualquer momento na sala."
          />

          {error ? (
            <p role="alert" className="rounded-md bg-red-50 px-3 py-2.5 text-sm text-red-700">
              {error}
            </p>
          ) : null}
          {notice ? (
            <p
              role="status"
              className="rounded-md border border-sage-100 bg-sage-100/70 px-3 py-2.5 text-sm font-medium text-sage-600"
            >
              {notice}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={saving}
            className="mt-1 self-start rounded-full bg-brand-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
          >
            {saving ? "Salvando…" : "Salvar alterações"}
          </button>
        </form>
      </section>
    </div>
  );
}
