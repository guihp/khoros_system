import { siteConfig } from "@/lib/blog/site";

export function ContentDisclaimer() {
  return (
    <p className="text-sm text-khoros-slate bg-muted rounded-lg px-4 py-3 border border-border">
      {siteConfig.disclaimer}
    </p>
  );
}
