import Image from "next/image";
import Link from "next/link";

export function Header() {
  return (
    <header className="sticky top-0 z-50 bg-card/95 backdrop-blur border-b border-border">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center group">
            <Image
              src="/brand/logo-horizontal-green.png"
              alt="KHOROS tecnologia"
              width={1465}
              height={400}
              priority
              className="h-10 w-auto object-contain"
            />
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-khoros-slate">
            <Link href="/blog" className="hover:text-khoros-cyan-dark transition-colors">
              Blog
            </Link>
            <Link href="/faq" className="hover:text-khoros-cyan-dark transition-colors">
              FAQ
            </Link>
            <Link href="/como-funciona" className="hover:text-khoros-cyan-dark transition-colors">
              Como funciona
            </Link>
            <Link href="/sobre" className="hover:text-khoros-cyan-dark transition-colors">
              Sobre
            </Link>
          </nav>

          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Onda 0: login só via /entrar (sem botão público). */}
            <Link
              href="/como-funciona#lista-espera"
              className="text-xs sm:text-sm font-medium bg-khoros-cyan text-white px-3 sm:px-4 py-2 rounded-full hover:bg-khoros-cyan-dark transition-colors"
            >
              Lista de espera
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
