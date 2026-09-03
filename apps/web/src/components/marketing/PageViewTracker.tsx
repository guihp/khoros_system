"use client";

import { Suspense, useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { trackEvent } from "@/lib/blog/analytics";

function PageViewTrackerInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastKey = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname) return;

    const search = searchParams?.toString() ?? "";
    const path = search ? `${pathname}?${search}` : pathname;
    const key = path;

    if (lastKey.current === key) return;
    lastKey.current = key;

    trackEvent({
      event: "page_view",
      path,
      referrer: typeof document !== "undefined" ? document.referrer || undefined : undefined,
    });
  }, [pathname, searchParams]);

  return null;
}

/** Dispara `page_view` em cada navegação do shell de marketing. */
export function PageViewTracker() {
  return (
    <Suspense fallback={null}>
      <PageViewTrackerInner />
    </Suspense>
  );
}
