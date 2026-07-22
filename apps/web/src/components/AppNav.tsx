"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { roleHomePath } from "@/lib/complete-registration";

export function AppNav() {
  const { user, me, signOut } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const role = me?.registered ? me.role : undefined;
  const needsRegistration = Boolean(user) && me?.registered === false;
  const logoHref = role ? roleHomePath(role) : "/";

  async function handleSignOut() {
    setOpen(false);
    await signOut();
    router.push("/");
  }

  const links = needsRegistration
    ? [{ href: "/cadastro", label: "Completar cadastro" }]
    : role === "PSYCHOLOGIST"
      ? [
          { href: "/pro", label: "Painel" },
          { href: "/perfil", label: "Perfil" },
        ]
      : role === "ADMIN"
        ? [{ href: "/admin", label: "Admin" }]
        : role === "PATIENT"
          ? [
              { href: "/paciente", label: "Profissionais" },
              { href: "/carteira", label: "Carteira" },
              { href: "/perfil", label: "Perfil" },
            ]
          : [{ href: "/", label: "Início" }];

  links.push({ href: "/apoio", label: "Apoio" });

  return (
    <nav className="w-full border-b border-calm-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
        <Link href={logoHref} className="font-display text-xl tracking-tight text-calm-900">
          KHOROS
        </Link>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label="Abrir menu"
          className="rounded-md p-2 text-calm-800 sm:hidden"
        >
          <span aria-hidden>{open ? "✕" : "☰"}</span>
        </button>

        <div className="hidden items-center gap-4 sm:flex">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="text-sm text-calm-800 hover:text-brand-700">
              {l.label}
            </Link>
          ))}
          {user ? (
            <button
              type="button"
              onClick={handleSignOut}
              className="rounded-full border border-calm-200 px-4 py-1.5 text-sm text-calm-800 hover:bg-calm-100"
            >
              Sair
            </button>
          ) : (
            <Link
              href="/entrar"
              className="rounded-full bg-brand-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-brand-700"
            >
              Entrar
            </Link>
          )}
        </div>
      </div>

      {open && (
        <div className="flex flex-col gap-1 border-t border-calm-200 px-4 py-3 sm:hidden">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="rounded-md px-2 py-2 text-sm text-calm-800 hover:bg-calm-100"
            >
              {l.label}
            </Link>
          ))}
          {user ? (
            <button
              type="button"
              onClick={handleSignOut}
              className="rounded-md px-2 py-2 text-left text-sm text-calm-800 hover:bg-calm-100"
            >
              Sair
            </button>
          ) : (
            <Link
              href="/entrar"
              onClick={() => setOpen(false)}
              className="rounded-md px-2 py-2 text-sm font-medium text-brand-700 hover:bg-calm-100"
            >
              Entrar
            </Link>
          )}
        </div>
      )}
    </nav>
  );
}
