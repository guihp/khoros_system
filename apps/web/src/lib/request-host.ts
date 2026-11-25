import { headers } from "next/headers";

export type HostKind = "site" | "blog" | "app" | "dev";

/** Qual dos subdomínios atendeu a requisição (só em rotas dinâmicas). */
export async function currentHostKind(): Promise<HostKind> {
  const h = await headers();
  const host = (h.get("x-forwarded-host") ?? h.get("host") ?? "").split(",")[0]!.trim().toLowerCase();
  if (host.startsWith("blog.")) return "blog";
  if (host.startsWith("app.") || host.startsWith("sistema.")) return "app";
  if (host.startsWith("localhost") || /^[\d.:]+$/.test(host)) return "dev";
  return "site";
}
