import Fastify, { type FastifyInstance } from "fastify";
import type { SupabaseClient } from "@supabase/supabase-js";
import { afterEach, describe, expect, it } from "vitest";
import { registerAuthPlugin } from "../../plugins/auth.js";
import { registerCmsRoutes } from "./routes.js";

interface QueryCall {
  table: string;
  operations: Array<{ name: string; args: unknown[] }>;
}

type TableResult = { data: unknown; error: { message: string } | null };

function createSupabaseFake(results: Record<string, TableResult>) {
  const calls: QueryCall[] = [];

  const from = (table: string) => {
    const call: QueryCall = { table, operations: [] };
    calls.push(call);

    const query = new Proxy(
      {},
      {
        get(_target, property) {
          if (property === "then") {
            return (
              resolve: (value: TableResult) => void,
              reject: (reason?: unknown) => void,
            ) => Promise.resolve(results[table] ?? { data: [], error: null }).then(resolve, reject);
          }
          return (...args: unknown[]) => {
            call.operations.push({ name: String(property), args });
            return query;
          };
        },
      },
    );

    return query;
  };

  return { client: { from } as unknown as SupabaseClient, calls };
}

async function makeApp(results: Record<string, TableResult> = {}): Promise<{
  app: FastifyInstance;
  calls: QueryCall[];
}> {
  const app = Fastify({ logger: false });
  const fake = createSupabaseFake(results);
  app.decorate("env", {
    SUPABASE_JWKS_URL: "https://example.test/auth/v1/.well-known/jwks.json",
  });
  app.decorate("supabase", fake.client);
  await registerAuthPlugin(app);
  await registerCmsRoutes(app);
  return { app, calls: fake.calls };
}

const apps: FastifyInstance[] = [];

afterEach(async () => {
  await Promise.all(apps.splice(0).map((app) => app.close()));
});

describe("CMS public routes", () => {
  it("returns only a published page and its visible ordered sections", async () => {
    const page = { id: "page-1", slug: "home", title: "Início", status: "PUBLISHED" };
    const section = {
      id: "section-1",
      page_id: "page-1",
      type: "hero",
      position: 0,
      is_visible: true,
      config: { title: "Cuidado agora", ctas: [] },
    };
    const { app, calls } = await makeApp({
      cms_pages: { data: page, error: null },
      cms_page_sections: { data: [section], error: null },
    });
    apps.push(app);

    const response = await app.inject({ method: "GET", url: "/cms/pages/home" });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ ...page, sections: [section] });
    expect(calls).toEqual([
      {
        table: "cms_pages",
        operations: [
          { name: "select", args: ["*"] },
          { name: "eq", args: ["slug", "home"] },
          { name: "eq", args: ["status", "PUBLISHED"] },
          { name: "maybeSingle", args: [] },
        ],
      },
      {
        table: "cms_page_sections",
        operations: [
          { name: "select", args: ["*"] },
          { name: "eq", args: ["page_id", "page-1"] },
          { name: "eq", args: ["is_visible", true] },
          { name: "order", args: ["position", { ascending: true }] },
        ],
      },
    ]);
  });

  it("filters article listings by published article and category status", async () => {
    const article = { id: "article-1", slug: "ansiedade", status: "PUBLISHED" };
    const { app, calls } = await makeApp({
      cms_articles: { data: [article], error: null },
    });
    apps.push(app);

    const response = await app.inject({ method: "GET", url: "/cms/articles?category=saude" });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ items: [article] });
    expect(calls[0]).toEqual({
      table: "cms_articles",
      operations: [
        {
          name: "select",
          args: ["*, category:cms_categories!inner(*), hero_media:cms_media(*)"],
        },
        { name: "eq", args: ["status", "PUBLISHED"] },
        { name: "eq", args: ["category.status", "PUBLISHED"] },
        { name: "eq", args: ["category.slug", "saude"] },
        { name: "order", args: ["published_at", { ascending: false }] },
      ],
    });
  });
});

describe("CMS admin routes", () => {
  it("requires authentication before allowing CMS writes", async () => {
    const { app, calls } = await makeApp();
    apps.push(app);

    const response = await app.inject({
      method: "POST",
      url: "/admin/cms/pages",
      payload: { slug: "home", title: "Início", status: "DRAFT" },
    });

    expect(response.statusCode).toBe(401);
    expect(response.json()).toMatchObject({ error: "UNAUTHENTICATED" });
    expect(calls).toHaveLength(0);
  });

  it("rejects a section whose config does not match its shared typed schema", async () => {
    const app = Fastify({ logger: false });
    const fake = createSupabaseFake({});
    app.decorate("supabase", fake.client);
    app.decorate("requireRole", () => async (req) => {
      req.authUser = {
        id: "admin-1",
        email: "admin@example.test",
        role: "ADMIN",
        status: "ACTIVE",
        registered: true,
      };
    });
    await registerCmsRoutes(app);
    apps.push(app);

    const response = await app.inject({
      method: "POST",
      url: "/admin/cms/pages/page-1/sections",
      payload: {
        type: "rich_text",
        position: 0,
        isVisible: true,
        config: { markdown: "" },
      },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({ error: "VALIDATION" });
    expect(fake.calls).toHaveLength(0);
  });

  it("rejects reorder requests containing duplicate section ids", async () => {
    const app = Fastify({ logger: false });
    const fake = createSupabaseFake({});
    app.decorate("supabase", fake.client);
    app.decorate("requireRole", () => async (req) => {
      req.authUser = {
        id: "admin-1",
        email: "admin@example.test",
        role: "ADMIN",
        status: "ACTIVE",
        registered: true,
      };
    });
    await registerCmsRoutes(app);
    apps.push(app);

    const response = await app.inject({
      method: "PUT",
      url: "/admin/cms/pages/page-1/sections/reorder",
      payload: { sectionIds: ["79b88ad1-91c1-4d16-b521-e57cd72b59ea", "79b88ad1-91c1-4d16-b521-e57cd72b59ea"] },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({ error: "VALIDATION" });
    expect(fake.calls).toHaveLength(0);
  });

});
