import type { FastifyBaseLogger } from "fastify";
import type { Env } from "../config.js";

export type CmsRevalidatePayload = {
  tags?: string[];
  paths?: string[];
  pageSlug?: string;
  article?: { category: string; slug: string };
  all?: boolean;
};

/**
 * Notifies Next.js `/api/cms/revalidate` after CMS publish/update.
 * Uses WEB_ORIGIN + optional CMS_REVALIDATE_SECRET (required in production web).
 * Failures are logged and never fail the admin mutation.
 */
export async function notifyCmsRevalidate(
  env: Env,
  log: FastifyBaseLogger,
  payload: CmsRevalidatePayload,
): Promise<void> {
  const base = env.WEB_ORIGIN.replace(/\/$/, "");
  const url = `${base}/api/cms/revalidate`;
  const headers: Record<string, string> = {
    "content-type": "application/json",
    accept: "application/json",
  };
  if (env.CMS_REVALIDATE_SECRET) {
    headers.authorization = `Bearer ${env.CMS_REVALIDATE_SECRET}`;
  }

  try {
    const res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      log.warn(
        { status: res.status, url, body: body.slice(0, 200) },
        "cms revalidate request failed",
      );
    }
  } catch (err) {
    log.warn(
      { err, url },
      "cms revalidate unreachable (is Next up? WEB_ORIGIN correct?)",
    );
  }
}
