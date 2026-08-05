import { describe, expect, it } from "vitest";
import { asciiRelatedSlug, asciiSlug } from "./slugify.js";

describe("asciiSlug", () => {
  it("transliterates portuguese accents", () => {
    expect(asciiSlug("comunicação-casal-conflitos")).toBe("comunicacao-casal-conflitos");
    expect(asciiSlug("traição-e-terapia-casal")).toBe("traicao-e-terapia-casal");
  });

  it("keeps already-valid slugs", () => {
    expect(asciiSlug("como-saber-se-e-normal")).toBe("como-saber-se-e-normal");
  });

  it("rejects empty result", () => {
    expect(() => asciiSlug("!!!")).toThrow(/Slug inválido/);
  });
});

describe("asciiRelatedSlug", () => {
  it("normalizes category/slug pairs", () => {
    expect(asciiRelatedSlug("terapia-casal/comunicação-casal-conflitos")).toBe(
      "terapia-casal/comunicacao-casal-conflitos",
    );
  });
});
