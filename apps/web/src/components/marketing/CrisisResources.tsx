import { siteConfig } from "@/lib/blog/site";

interface CrisisResourcesProps {
  variant?: "banner" | "footer" | "inline";
}

export function CrisisResources({ variant = "inline" }: CrisisResourcesProps) {
  const { cvv, samu, caps, emergency } = siteConfig.crisisResources;

  if (variant === "banner") {
    return (
      <div
        role="alert"
        className="bg-sand-50 border border-sand-100 rounded-2xl p-5 sm:p-6"
      >
        <p className="font-semibold text-calm-900 mb-2">
          Se você está em crise ou pensando em se machucar, busque ajuda agora:
        </p>
        <ul className="text-sm text-calm-700 space-y-1">
          <li>
            <strong>{cvv.label}</strong> — ligação gratuita 24h e chat em{" "}
            <a href={cvv.url} className="underline" target="_blank" rel="noopener noreferrer">
              cvv.org.br
            </a>
          </li>
          <li><strong>{samu.label}</strong></li>
          <li><strong>{caps.label}</strong></li>
          <li><strong>{emergency.label}</strong></li>
        </ul>
      </div>
    );
  }

  if (variant === "footer") {
    return (
      <div className="text-sm text-white/75 sm:flex sm:items-center sm:gap-6">
        <p className="font-semibold text-white mb-2 sm:mb-0 shrink-0">Precisa de apoio agora?</p>
        <p className="leading-relaxed">
          {cvv.label} · {samu.label} · {caps.label} · {emergency.label}
        </p>
      </div>
    );
  }

  return (
    <aside className="mt-10 bg-brand-50 ring-1 ring-brand-100 rounded-2xl p-6 text-sm text-calm-600">
      <p className="font-medium text-foreground mb-2">Recursos de apoio</p>
      <ul className="space-y-1">
        <li>{cvv.label} — <a href={cvv.url} className="text-brand-700 underline" target="_blank" rel="noopener noreferrer">cvv.org.br</a></li>
        <li>{samu.label}</li>
        <li>{caps.label}</li>
        <li>{emergency.label}</li>
      </ul>
    </aside>
  );
}
