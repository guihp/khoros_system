import { describe, expect, it } from "vitest";
import {
  CMS_CONTENT_STATUSES,
  CMS_SECTION_TYPES,
  cmsSectionSchema,
} from "./cms.js";

describe("CMS contracts", () => {
  it("keeps content statuses aligned with Postgres", () => {
    expect(CMS_CONTENT_STATUSES).toEqual(["DRAFT", "PUBLISHED"]);
  });

  it("keeps section types aligned with Postgres", () => {
    expect(CMS_SECTION_TYPES).toEqual([
      "hero",
      "category_grid",
      "article_list",
      "rich_text",
      "cta_band",
      "faq",
      "steps",
      "crisis_banner",
      "validation_block",
      "disclaimer",
    ]);
  });

  it("accepts a typed hero section", () => {
    expect(
      cmsSectionSchema.parse({
        type: "hero",
        config: {
          eyebrow: "Cuidado no seu tempo",
          title: "Acolhimento quando você precisa",
          subtitle: "Converse com profissionais verificados.",
          ctas: [{ label: "Sou paciente", href: "/cadastro?role=PATIENT", variant: "primary" }],
        },
      }),
    ).toMatchObject({ type: "hero" });
  });

  it("rejects config from a different section type", () => {
    expect(() =>
      cmsSectionSchema.parse({
        type: "faq",
        config: { markdown: "Configuração de rich text" },
      }),
    ).toThrow();
  });

  it("rejects unsafe CTA URLs", () => {
    expect(() =>
      cmsSectionSchema.parse({
        type: "cta_band",
        config: {
          title: "Fale conosco",
          buttons: [{ label: "Abrir", href: "javascript:alert(1)" }],
        },
      }),
    ).toThrow();
  });
});
