import { NextResponse } from "next/server";

/**
 * Liveness do container `web` (healthcheck do docker-compose/Coolify).
 * Não depende do CMS/API: conteúdo vazio ou API fora não deve tirar o site
 * (nem o /admin, usado para publicar) da rota do proxy.
 */
export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json({ status: "ok", ts: new Date().toISOString() });
}
