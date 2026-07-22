export type AnalyticsEvent =
  | "validation_clarified"
  | "validation_needs_help"
  | "lead_form_open"
  | "lead_form_submit"
  | "lead_form_success"
  | "lead_form_error"
  | "waitlist_submit";

export interface EventPayload {
  event: AnalyticsEvent;
  articleSlug?: string;
  articleCategory?: string;
  articleTitle?: string;
  city?: string;
  source?: string;
  [key: string]: string | undefined;
}

declare global {
  interface Window {
    plausible?: (event: string, options?: { props?: Record<string, string> }) => void;
    gtag?: (...args: unknown[]) => void;
  }
}

export function trackEvent(payload: EventPayload) {
  const { event, ...props } = payload;

  if (typeof window !== "undefined" && window.plausible) {
    window.plausible(event, { props: props as Record<string, string> });
  }

  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", event, props);
  }

  if (process.env.NODE_ENV === "development") {
    console.log("[analytics]", event, props);
  }
}

export async function trackEventServer(payload: EventPayload) {
  try {
    await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch {
    // silent fail for analytics
  }
}
