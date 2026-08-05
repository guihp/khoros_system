import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/blog/supabase";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * Stable public URL for published CMS media.
 * Avoids baking short-lived signed URLs into SSG/ISR HTML while the
 * `cms-media` bucket stays private (drafts remain inaccessible).
 */
export async function GET(_req: Request, context: RouteContext) {
  const { id } = await context.params;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  const supabase = createSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ error: "STORAGE_UNAVAILABLE" }, { status: 503 });
  }

  const { data: media, error: metaError } = await supabase
    .from("cms_media")
    .select("id, storage_path, mime_type, status")
    .eq("id", id)
    .eq("status", "PUBLISHED")
    .maybeSingle();

  if (metaError || !media?.storage_path) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  const { data: blob, error: downloadError } = await supabase.storage
    .from("cms-media")
    .download(media.storage_path);

  if (downloadError || !blob) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  const buffer = Buffer.from(await blob.arrayBuffer());
  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type": media.mime_type || "application/octet-stream",
      "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
      "Content-Length": String(buffer.byteLength),
    },
  });
}
