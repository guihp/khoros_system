"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const NAV = [
  { href: "/blog", label: "Blog" },
  { href: "/como-funciona", label: "Como funciona" },
  { href: "/sobre", label: "Sobre" },
  { href: "/faq", label: "FAQ" },
];

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Header() {
  const pathname = usePathname() ?? "/";
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled || open
          ? "bg-white/90 backdrop-blur-md border-b border-calm-200 shadow-[0_1px_0_rgb(0_0_0/0.02)]"
          : "bg-transparent border-b border-transparent"
      }`}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-[72px]">
          <Link href="/" className="flex shrink-0 items-center" aria-label="KHOROS — página inicial">
            <Image
              src="/brand/logo-horizontal-green.png"
              alt="KHOROS tecnologia"
              width={1465}
              height={400}
              priority
              className="h-9 sm:h-10 w-auto max-w-none object-contain"
            />
          </Link>

          <nav className="hidden md:flex items-center gap-1" aria-label="Principal">
            {NAV.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`relative px-3.5 py-2 rounded-full text-sm font-medium transition-colors ${
                    active
                      ? "text-brand-800 bg-brand-50"
                      : "text-calm-600 hover:text-brand-800 hover:bg-brand-50/70"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            {/* Onda 0: login só via /entrar (sem botão público). */}
            <Link href="/como-funciona#lista-espera" className="btn-primary !px-3.5 sm:!px-4 !py-2 !text-[13px] sm:!text-sm whitespace-nowrap">
              Lista de espera
            </Link>
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-controls="menu-mobile"
              aria-label={open ? "Fechar menu" : "Abrir menu"}
              className="md:hidden inline-flex h-10 w-10 items-center justify-center rounded-full text-calm-800 hover:bg-brand-50"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
                {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
              </svg>
            </button>
          </div>
        </div>

        {open && (
          <nav id="menu-mobile" className="md:hidden pb-4 animate-rise-in" aria-label="Menu">
            <ul className="flex flex-col gap-1">
              {NAV.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`block rounded-xl px-4 py-3 text-base font-medium ${
                      isActive(pathname, item.href) ? "bg-brand-50 text-brand-800" : "text-calm-700 hover:bg-calm-100"
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </div>
    </header>
  );
}
