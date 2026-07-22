import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseAdmin } from "@/lib/blog/supabase";

const leadSchema = z.object({
  name: z.string().min(2, "Nome muito curto"),
  email: z.string().email("E-mail inválido"),
  /** Legado — plataforma é online; cidade não é mais coletada no formulário. */
  city: z.string().min(2).optional(),
  consent: z.literal(true, { errorMap: () => ({ message: "Consentimento obrigatório" }) }),
  article_slug: z.string().optional(),
  article_category: z.string().optional(),
  article_title: z.string().optional(),
  source: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = leadSchema.parse(body);
    const city = data.city?.trim() || "online";

    const supabase = createSupabaseAdmin();

    if (supabase) {
      const { error } = await supabase.from("leads").insert({
        name: data.name,
        email: data.email.toLowerCase(),
        city,
        article_slug: data.article_slug,
        article_category: data.article_category,
        article_title: data.article_title,
        source: data.source || "article",
        consent: data.consent,
        consent_at: new Date().toISOString(),
      });

      if (error) {
        console.error("Supabase error:", error);
        return NextResponse.json(
          { error: "Erro ao salvar. Tente novamente." },
          { status: 500 }
        );
      }
    } else {
      console.log("[lead captured - no supabase]", data);
    }

    const webhookUrl = process.env.N8N_WEBHOOK_URL;
    if (webhookUrl) {
      await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          captured_at: new Date().toISOString(),
        }),
      }).catch(() => {});
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: err.issues[0]?.message || "Dados inválidos" },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
