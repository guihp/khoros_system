import Link from "next/link";
import { siteConfig } from "@/lib/blog/site";
import { CrisisResources } from "./CrisisResources";

export function Footer() {
  return (
    <footer className="bg-foreground text-white mt-auto">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid md:grid-cols-3 gap-8 mb-10">
          <div>
            <p className="font-semibold text-lg mb-2">{siteConfig.name}</p>
            <p className="text-sm text-white/70 leading-relaxed">
              {siteConfig.description}
            </p>
          </div>

          <div>
            <p className="font-medium mb-3">Navegação</p>
            <ul className="space-y-2 text-sm text-white/70">
              <li><Link href="/blog" className="hover:text-white transition-colors">Blog</Link></li>
              <li><Link href="/faq" className="hover:text-white transition-colors">FAQ</Link></li>
              <li><Link href="/como-funciona" className="hover:text-white transition-colors">Como funciona</Link></li>
              <li><Link href="/sobre" className="hover:text-white transition-colors">Sobre</Link></li>
            </ul>
          </div>

          <div>
            <p className="font-medium mb-3">Políticas</p>
            <ul className="space-y-2 text-sm text-white/70">
              <li><Link href="/politicas/privacidade" className="hover:text-white transition-colors">Privacidade (LGPD)</Link></li>
              <li><Link href="/politicas/termos" className="hover:text-white transition-colors">Termos de uso</Link></li>
              <li><Link href="/politicas/aviso" className="hover:text-white transition-colors">Aviso de conteúdo</Link></li>
            </ul>
          </div>
        </div>

        <CrisisResources variant="footer" />

        <div className="mt-8 pt-8 border-t border-white/10 text-xs text-white/50 space-y-2">
          <p>{siteConfig.disclaimer}</p>
          <p className="italic">{siteConfig.goldenRule}</p>
          <p>© {new Date().getFullYear()} KHOROS. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  );
}
