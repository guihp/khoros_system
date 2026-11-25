import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseAdmin } from "@/lib/blog/supabase";
import { clientIp, rateLimit } from "@/lib/server/rate-limit";

const leadSchema = z.object({
  name: z.string().trim().min(2, "Nome muito curto").max(120),
  email: z.string().trim().max(254).email("E-mail inválido"),
  phone: z
    .string()
    .min(1, "Celular obrigatório")
    .transform((v) => v.replace(/\D/g, ""))
    .refine((d) => /^\d{2}9\d{8}$/.test(d), {
      message: "Celular inválido. Use o formato (XX) 9 XXXX-XXXX.",
    }),
  /** Legado — plataforma é online; cidade não é mais coletada no formulário. */
  city: z.string().min(2).max(80).optional(),
  consent: z.literal(true, { errorMap: () => ({ message: "Consentimento obrigatório" }) }),
  article_slug: z.string().max(200).optional(),
  article_category: z.string().max(200).optional(),
  article_title: z.string().max(300).optional(),
  source: z.string().max(60).optional(),
});

export async function POST(request: Request) {
  if (!rateLimit(`lead:${clientIp(request)}`, 5, 10 * 60_000)) {
    return NextResponse.json({ error: "Muitas tentativas. Tente novamente em alguns minutos." }, { status: 429 });
  }
  try {
    const body = await request.json();
    const data = leadSchema.parse(body);
    const city = data.city?.trim() || "online";

    const supabase = createSupabaseAdmin();

    if (!supabase) {
      if (process.env.NODE_ENV === "production") {
        console.error("[leads] Supabase credentials missing in production");
        return NextResponse.json(
          { error: "Serviço temporariamente indisponível." },
          { status: 503 },
        );
      }
      console.log("[lead captured - no supabase]", data);
    } else {
      const { error } = await supabase.from("leads").insert({
        name: data.name,
        email: data.email.toLowerCase(),
        phone: data.phone,
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
