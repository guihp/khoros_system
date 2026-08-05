import { describe, expect, it } from "vitest";
import { parseMdxArticle } from "./parse-mdx-article.js";

const SAMPLE = `---
title: Título de teste
description: Descrição curta do artigo de teste.
category: ansiedade
slug: comunicação-teste
publishedAt: '2025-06-20'
author: Equipe KHOROS
reviewer: Dra. Ana Paula Mendes
reviewerCrp: 06/123456
image: /images/categories/ansiedade.jpg
imageAlt: Alt texto
sensitive: false
sources:
  - OMS
faq:
  - question: Pergunta?
    answer: Resposta curta.
relatedSlugs:
  - ansiedade/como-saber-se-e-normal
  - terapia-casal/comunicação-casal-conflitos
---

Corpo do artigo em **MDX**.
`;

describe("parseMdxArticle", () => {
  it("parses frontmatter and body, normalizing accented slugs", () => {
    const article = parseMdxArticle("sample.mdx", SAMPLE);
    expect(article.slug).toBe("comunicacao-teste");
    expect(article.originalSlug).toBe("comunicação-teste");
    expect(article.slugNormalized).toBe(true);
    expect(article.categorySlug).toBe("ansiedade");
    expect(article.bodyMdx).toContain("Corpo do artigo");
    expect(article.legacyImagePath).toBe("/images/categories/ansiedade.jpg");
    expect(article.faq).toHaveLength(1);
    expect(article.relatedSlugs).toEqual([
      "ansiedade/como-saber-se-e-normal",
      "terapia-casal/comunicacao-casal-conflitos",
    ]);
    expect(article.publishedAt.toISOString()).toBe("2025-06-20T00:00:00.000Z");
  });

  it("rejects empty body", () => {
    expect(() =>
      parseMdxArticle(
        "empty.mdx",
        `---
title: X
description: Yyyyyyyyy
category: ansiedade
slug: x
publishedAt: '2025-01-01'
author: Equipe
---

`,
      ),
    ).toThrow(/body MDX vazio/);
  });
});
