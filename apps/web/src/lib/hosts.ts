/**
 * Subdomínios (pedido do cliente):
 *   khorosicp.online       → site institucional
 *   blog.khorosicp.online  → blog
 *   app.khorosicp.online   → sistema (paciente, psicólogo, admin)
 *
 * Tudo vem de NEXT_PUBLIC_SITE_URL (domínio raiz). Em localhost/IP não há
 * subdomínios: tudo continua em caminhos (/blog, /entrar...).
 */
const SITE = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");

function parse(): { protocol: string; root: string } | null {
  try {
    const u = new URL(SITE);
    if (u.hostname === "localhost" || /^[\d.]+$/.test(u.hostname) || !u.hostname.includes(".")) return null;
    return { protocol: u.protocol, root: u.host.replace(/^(www|app|blog|sistema)\./, "") };
  } catch {
    return null;
  }
}

const parsed = parse();

/** Domínio raiz (ex.: khorosicp.online) ou null em dev. */
export const ROOT_DOMAIN = parsed?.root ?? null;
export const SITE_URL = parsed ? `${parsed.protocol}//${parsed.root}` : SITE;
export const BLOG_URL = parsed ? `${parsed.protocol}//blog.${parsed.root}` : `${SITE}/blog`;
export const APP_URL = parsed ? `${parsed.protocol}//app.${parsed.root}` : SITE;

/** Link para o blog. `path` é relativo ao blog: "/", "/categoria/x", "/cat/slug". */
export function blogHref(path = "/"): string {
  const p = path === "/" ? "" : path;
  return parsed ? `${BLOG_URL}${p || "/"}` : `/blog${p}`;
}

/** Converte um caminho antigo "/blog/..." em URL do blog. */
export function blogHrefFromLegacy(path: string): string {
  return blogHref(path.replace(/^\/blog(?=\/|$)/, "") || "/");
}

export function siteHref(path: string): string {
  return parsed ? `${SITE_URL}${path}` : path;
}

export function appHref(path: string): string {
  return parsed ? `${APP_URL}${path}` : path;
}

/** Rotas do sistema (ficam em app.). */
export const APP_PREFIXES = [
  "/entrar",
  "/cadastro",
  "/paciente",
  "/pro",
  "/admin",
  "/carteira",
  "/sessao",
  "/triagem",
  "/consentimentos",
  "/perfil",
  "/psicologos",
  "/profissional",
] as const;

/** Páginas do site institucional (ficam no domínio raiz). */
export const SITE_PREFIXES = ["/como-funciona", "/sobre", "/faq"] as const;

/** Servidas em qualquer subdomínio (legais / apoio em crise). */
export const SHARED_PREFIXES = ["/politicas", "/apoio"] as const;

export function matchesPrefix(pathname: string, prefixes: readonly string[]): boolean {
  return prefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}
