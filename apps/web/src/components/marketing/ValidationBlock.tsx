"use client";

import { useState } from "react";
import { trackEvent } from "@/lib/blog/analytics";
import { LeadCaptureModal } from "./LeadCaptureModal";

interface ValidationBlockProps {
  articleSlug: string;
  articleCategory: string;
  articleTitle: string;
}

export function ValidationBlock({
  articleSlug,
  articleCategory,
  articleTitle,
}: ValidationBlockProps) {
  const [showLeadModal, setShowLeadModal] = useState(false);
  const [answered, setAnswered] = useState<"clarified" | "needs_help" | null>(null);

  const handleClarified = () => {
    setAnswered("clarified");
    trackEvent({
      event: "validation_clarified",
      articleSlug,
      articleCategory,
      articleTitle,
    });
  };

  const handleNeedsHelp = () => {
    setAnswered("needs_help");
    trackEvent({
      event: "validation_needs_help",
      articleSlug,
      articleCategory,
      articleTitle,
    });
    trackEvent({
      event: "lead_form_open",
      articleSlug,
      articleCategory,
      articleTitle,
    });
    setShowLeadModal(true);
  };

  return (
    <>
      <section
        className="bg-khoros-warm border border-border rounded-2xl p-6 sm:p-8 my-10"
        aria-labelledby="validation-heading"
      >
        <h2 id="validation-heading" className="text-xl font-semibold text-foreground mb-4">
          Este conteúdo ajudou você?
        </h2>

        {answered ? (
          <p className="text-khoros-slate">
            {answered === "clarified"
              ? "Que bom que o conteúdo esclareceu suas dúvidas. Cuide-se — e volte sempre que precisar."
              : "Entendemos. Buscar orientação profissional é um passo de coragem e autocuidado."}
          </p>
        ) : (
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleClarified}
              className="flex-1 px-5 py-3 rounded-xl border-2 border-khoros-sage bg-white text-foreground font-medium hover:bg-khoros-mint transition-colors text-left"
            >
              Sim, minha dúvida foi esclarecida.
            </button>
            <button
              onClick={handleNeedsHelp}
              className="flex-1 px-5 py-3 rounded-xl border-2 border-khoros-cyan bg-khoros-cyan text-white font-medium hover:bg-khoros-cyan-dark transition-colors text-left"
            >
              Ainda sinto necessidade de orientação profissional.
            </button>
          </div>
        )}
      </section>

      <LeadCaptureModal
        open={showLeadModal}
        onClose={() => setShowLeadModal(false)}
        articleSlug={articleSlug}
        articleCategory={articleCategory}
        articleTitle={articleTitle}
      />
    </>
  );
}
