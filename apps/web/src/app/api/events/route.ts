import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/blog/supabase";
import { ANALYTICS_EVENT_WHITELIST, type AnalyticsEvent } from "@/lib/blog/analytics";

const ALLOWED = new Set<string>(ANALYTICS_EVENT_WHITELIST);

function asOptionalString(value: unknown, maxLen = 500): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, maxLen);
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const event = typeof body.event === "string" ? body.event : null;

    if (!event || !ALLOWED.has(event)) {
      return NextResponse.json({ error: "Invalid event" }, { status: 400 });
    }

    const articleSlug =
      asOptionalString(body.article_slug) ?? asOptionalString(body.articleSlug);
    const articleCategory =
      asOptionalString(body.article_category) ?? asOptionalString(body.articleCategory);

    const typed = {
      event_name: event as AnalyticsEvent,
      path: asOptionalString(body.path, 1000),
      referrer: asOptionalString(body.referrer, 1000),
      utm_source: asOptionalString(body.utm_source, 200),
      utm_medium: asOptionalString(body.utm_medium, 200),
      utm_campaign: asOptionalString(body.utm_campaign, 200),
      utm_content: asOptionalString(body.utm_content, 200),
      utm_term: asOptionalString(body.utm_term, 200),
      visitor_id: asOptionalString(body.visitor_id, 64),
      session_id: asOptionalString(body.session_id, 64),
      device_type: asOptionalString(body.device_type, 32),
      article_slug: articleSlug,
      article_category: articleCategory,
    };

    const reserved = new Set([
      "event",
      "path",
      "referrer",
      "utm_source",
      "utm_medium",
      "utm_campaign",
      "utm_content",
      "utm_term",
      "visitor_id",
      "session_id",
      "device_type",
      "article_slug",
      "article_category",
      "articleSlug",
      "articleCategory",
    ]);

    const properties: Record<string, string> = {};
    for (const [key, value] of Object.entries(body)) {
      if (reserved.has(key)) continue;
      if (typeof value !== "string") continue;
      const trimmed = value.trim();
      if (!trimmed) continue;
      properties[key] = trimmed.slice(0, 500);
    }

    const supabase = createSupabaseAdmin();
    if (supabase) {
      await supabase.from("analytics_events").insert({
        ...typed,
        properties,
        created_at: new Date().toISOString(),
      });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: true });
  }
}
