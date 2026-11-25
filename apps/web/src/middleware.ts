import { NextResponse, type NextRequest } from "next/server";
import { APP_PREFIXES, ROOT_DOMAIN, SHARED_PREFIXES, SITE_PREFIXES, matchesPrefix } from "@/lib/hosts";

/**
 * Roteamento por subdomínio — um único Next.js atende os três endereços:
 *   raiz  → site institucional      blog. → blog (sem o prefixo /blog na URL)
 *   app.  → sistema                 www./sistema. → redirecionam
 * Em localhost (ROOT_DOMAIN null) nada muda.
 */
export function middleware(req: NextRequest) {
  if (!ROOT_DOMAIN) return NextResponse.next();

  const host = (req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? "").split(",")[0]!.trim().split(":")[0]!.toLowerCase();
  const { pathname, search } = req.nextUrl;
  const root = ROOT_DOMAIN.split(":")[0]!;
  const to = (sub: string | null, path: string) =>
    NextResponse.redirect(new URL(`https://${sub ? `${sub}.` : ""}${root}${path}${search}`), 308);

  const isApp = matchesPrefix(pathname, APP_PREFIXES);
  const isSite = matchesPrefix(pathname, SITE_PREFIXES);
  const isShared = matchesPrefix(pathname, SHARED_PREFIXES);
  const isLegacyBlog = pathname === "/blog" || pathname.startsWith("/blog/");

  switch (host) {
    case `www.${root}`:
      return to(null, pathname);

    case `sistema.${root}`:
      // Endereço antigo do sistema (links de e-mail do Supabase continuam funcionando).
      return to("app", pathname);

    case `app.${root}`:
      if (pathname === "/") return NextResponse.redirect(new URL(`/entrar${search}`, req.url), 307);
      if (isApp || isShared) return NextResponse.next();
      if (isLegacyBlog) return to("blog", pathname.replace(/^\/blog/, "") || "/");
      return to(null, pathname);

    case `blog.${root}`: {
      if (isApp) return to("app", pathname);
      if (isSite) return to(null, pathname);
      if (isShared || isLegacyBlog) return NextResponse.next();
      const url = req.nextUrl.clone();
      url.pathname = pathname === "/" ? "/blog" : `/blog${pathname}`;
      return NextResponse.rewrite(url);
    }

    case root:
      if (isApp) return to("app", pathname);
      if (isLegacyBlog) return to("blog", pathname.replace(/^\/blog/, "") || "/");
      return NextResponse.next();

    default:
      // Endereços internos do Coolify etc.: sem roteamento.
      return NextResponse.next();
  }
}

export const config = {
  // Fora: API routes, assets do Next, arquivos com extensão (imagens, sitemap.xml, robots.txt).
  matcher: ["/((?!api/|_next/|.*[.][a-zA-Z0-9]+$).*)"],
};
