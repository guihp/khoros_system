"use client";

import { useState } from "react";

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQAccordionProps {
  items: FAQItem[];
  id?: string;
}

export function FAQAccordion({ items, id = "faq" }: FAQAccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="space-y-3" id={id}>
      {items.map((item, index) => (
        <div
          key={index}
          className="border border-border rounded-xl overflow-hidden bg-card"
        >
          <button
            className="w-full px-5 py-4 text-left font-medium text-foreground flex justify-between items-center gap-4 hover:bg-muted/50 transition-colors"
            onClick={() => setOpenIndex(openIndex === index ? null : index)}
            aria-expanded={openIndex === index}
          >
            <span>{item.question}</span>
            <span className="text-khoros-cyan text-xl shrink-0">
              {openIndex === index ? "−" : "+"}
            </span>
          </button>
          {openIndex === index && (
            <div className="px-5 pb-4 text-khoros-slate leading-relaxed">
              {item.answer}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
