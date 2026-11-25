"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { roleHomePath } from "@/lib/complete-registration";

export function AppNav() {
  const { user, me, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);
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
    <nav className="sticky top-0 z-40 w-full border-b border-calm-200 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href={logoHref} className="flex shrink-0 items-center" aria-label="KHOROS — início">
          <Image
            src="/brand/logo-horizontal-green.png"
            alt="KHOROS tecnologia"
            width={1465}
            height={400}
            priority
            className="h-9 w-auto max-w-none object-contain"
          />
        </Link>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label="Abrir menu"
          className="inline-flex h-10 w-10 items-center justify-center rounded-full text-calm-800 hover:bg-brand-50 sm:hidden"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
            {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
          </svg>
        </button>

        <div className="hidden items-center gap-1 sm:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              aria-current={isActive(l.href) ? "page" : undefined}
              className={`rounded-full px-3.5 py-2 text-sm font-medium transition-colors ${
                isActive(l.href) ? "bg-brand-50 text-brand-800" : "text-calm-600 hover:bg-brand-50/70 hover:text-brand-800"
              }`}
            >
              {l.label}
            </Link>
          ))}
          {user ? (
            <button
              type="button"
              onClick={handleSignOut}
              className="ml-2 rounded-full border border-calm-200 px-4 py-2 text-sm font-medium text-calm-700 hover:bg-calm-100"
            >
              Sair
            </button>
          ) : (
            <Link
              href="/entrar"
              className="btn-primary ml-2 !px-4 !py-2 text-sm"
            >
              Entrar
            </Link>
          )}
        </div>
      </div>

      {open && (
        <div className="flex flex-col gap-1 border-t border-calm-200 px-4 py-3 sm:hidden animate-rise-in">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className={`rounded-xl px-3 py-3 text-base ${isActive(l.href) ? "bg-brand-50 text-brand-800 font-medium" : "text-calm-800 hover:bg-calm-100"}`}
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
