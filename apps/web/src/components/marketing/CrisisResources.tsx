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
        className="bg-amber-50 border border-amber-200 rounded-xl p-4 sm:p-5"
      >
        <p className="font-semibold text-amber-900 mb-2">
          Se você está em crise ou pensando em se machucar, busque ajuda agora:
        </p>
        <ul className="text-sm text-amber-800 space-y-1">
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
      <div className="text-sm text-white/70">
        <p className="font-medium text-white mb-2">Recursos de apoio</p>
        <p>
          {cvv.label} · {samu.label} · {caps.label} · {emergency.label}
        </p>
      </div>
    );
  }

  return (
    <aside className="bg-khoros-mint rounded-xl p-5 text-sm text-khoros-slate">
      <p className="font-medium text-foreground mb-2">Recursos de apoio</p>
      <ul className="space-y-1">
        <li>{cvv.label} — <a href={cvv.url} className="text-khoros-cyan-dark underline" target="_blank" rel="noopener noreferrer">cvv.org.br</a></li>
        <li>{samu.label}</li>
        <li>{caps.label}</li>
        <li>{emergency.label}</li>
      </ul>
    </aside>
  );
}
