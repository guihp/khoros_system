export type AnalyticsEvent =
  | "page_view"
  | "validation_clarified"
  | "validation_needs_help"
  | "lead_form_open"
  | "lead_form_submit"
  | "lead_form_success"
  | "lead_form_error"
  | "waitlist_submit";

export const ANALYTICS_EVENT_WHITELIST: readonly AnalyticsEvent[] = [
  "page_view",
  "validation_clarified",
  "validation_needs_help",
  "lead_form_open",
  "lead_form_submit",
  "lead_form_success",
  "lead_form_error",
  "waitlist_submit",
] as const;

export interface EventPayload {
  event: AnalyticsEvent;
  articleSlug?: string;
  articleCategory?: string;
  articleTitle?: string;
  city?: string;
  source?: string;
  path?: string;
  referrer?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  visitor_id?: string;
  session_id?: string;
  device_type?: string;
  article_slug?: string;
  article_category?: string;
  [key: string]: string | undefined;
}

export type DeviceType = "mobile" | "tablet" | "desktop";

declare global {
  interface Window {
    plausible?: (event: string, options?: { props?: Record<string, string> }) => void;
    gtag?: (...args: unknown[]) => void;
  }
}

const VISITOR_COOKIE = "khoros_vid";
const SESSION_KEY = "khoros_sid";
const VISITOR_MAX_AGE_SEC = 365 * 24 * 60 * 60;

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match?.[1] ? decodeURIComponent(match[1]) : null;
}

export function getOrCreateVisitorId(): string {
  const existing = readCookie(VISITOR_COOKIE);
  if (existing) return existing;

  const id = crypto.randomUUID();
  document.cookie = `${VISITOR_COOKIE}=${encodeURIComponent(id)}; path=/; max-age=${VISITOR_MAX_AGE_SEC}; SameSite=Lax`;
  return id;
}

export function getOrCreateSessionId(): string {
  try {
    const existing = sessionStorage.getItem(SESSION_KEY);
    if (existing) return existing;
    const id = crypto.randomUUID();
    sessionStorage.setItem(SESSION_KEY, id);
    return id;
  } catch {
    return crypto.randomUUID();
  }
}

export function parseUtms(search?: string): {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
} {
  const params = new URLSearchParams(
    search ?? (typeof window !== "undefined" ? window.location.search : ""),
  );
  const pick = (key: string) => params.get(key)?.trim() || undefined;
  return {
    utm_source: pick("utm_source"),
    utm_medium: pick("utm_medium"),
    utm_campaign: pick("utm_campaign"),
    utm_content: pick("utm_content"),
    utm_term: pick("utm_term"),
  };
}

export function detectDeviceType(): DeviceType {
  if (typeof navigator === "undefined") return "desktop";
  const ua = navigator.userAgent;
  if (/iPad|Tablet|Android(?!.*Mobile)/i.test(ua)) return "tablet";
  if (/Mobi|Android|iPhone|iPod/i.test(ua)) return "mobile";
  return "desktop";
}

function enrichPayload(payload: EventPayload): EventPayload {
  if (typeof window === "undefined") return payload;

  const utms = parseUtms();
  return {
    ...payload,
    path: payload.path ?? `${window.location.pathname}${window.location.search}`,
    referrer: payload.referrer ?? (document.referrer || undefined),
    utm_source: payload.utm_source ?? utms.utm_source,
    utm_medium: payload.utm_medium ?? utms.utm_medium,
    utm_campaign: payload.utm_campaign ?? utms.utm_campaign,
    utm_content: payload.utm_content ?? utms.utm_content,
    utm_term: payload.utm_term ?? utms.utm_term,
    visitor_id: payload.visitor_id ?? getOrCreateVisitorId(),
    session_id: payload.session_id ?? getOrCreateSessionId(),
    device_type: payload.device_type ?? detectDeviceType(),
    article_slug: payload.article_slug ?? payload.articleSlug,
    article_category: payload.article_category ?? payload.articleCategory,
  };
}

export function trackEvent(payload: EventPayload) {
  const enriched = enrichPayload(payload);
  const { event, ...props } = enriched;

  if (typeof window !== "undefined" && window.plausible) {
    window.plausible(event, { props: props as Record<string, string> });
  }

  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", event, props);
  }

  if (process.env.NODE_ENV === "development") {
    console.log("[analytics]", event, props);
  }

  void trackEventServer(enriched);
}

export async function trackEventServer(payload: EventPayload) {
  try {
    await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true,
    });
  } catch {
    // silent fail for analytics
  }
}
