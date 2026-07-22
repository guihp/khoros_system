import Image from "next/image";
import Link from "next/link";

export function Header() {
  return (
    <header className="sticky top-0 z-50 bg-card/95 backdrop-blur border-b border-border">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center group">
            <Image
              src="/logo.png"
              alt="khoros"
              width={140}
              height={40}
              priority
              className="h-8 w-auto object-contain"
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

          <div className="flex items-center gap-2">
            <Link
              href="/cadastro"
              className="hidden sm:inline-flex text-sm font-medium text-khoros-cyan-dark px-3 py-2 hover:underline"
            >
              Criar conta
            </Link>
            <Link
              href="/entrar"
              className="text-sm font-medium bg-khoros-cyan text-white px-4 py-2 rounded-full hover:bg-khoros-cyan-dark transition-colors"
            >
              Entrar
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
