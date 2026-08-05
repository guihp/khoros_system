import { describe, expect, it } from "vitest";
import { buildMarketingPages } from "./marketing-pages.js";

describe("buildMarketingPages", () => {
  it("builds seven published marketing pages with typed sections", () => {
    const pages = buildMarketingPages(
      [
        { slug: "ansiedade", name: "Ansiedade" },
        { slug: "burnout", name: "Burnout" },
      ],
      [
        {
          category: "ansiedade",
          question: "O que é ansiedade?",
          answer: "Uma resposta de exemplo dentro do limite.",
        },
      ],
    );

    expect(pages.map((p) => p.slug)).toEqual([
      "home",
      "sobre",
      "como-funciona",
      "faq",
      "politicas-privacidade",
      "politicas-termos",
      "politicas-aviso",
    ]);

    const faq = pages.find((p) => p.slug === "faq");
    expect(faq?.sections.filter((s) => s.type === "faq")).toHaveLength(1);
    expect(pages.every((p) => p.sections.length > 0)).toBe(true);
  });
});
