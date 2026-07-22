import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/blog/supabase";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { event, ...props } = body;

    if (!event) {
      return NextResponse.json({ error: "Event required" }, { status: 400 });
    }

    const supabase = createSupabaseAdmin();
    if (supabase) {
      await supabase.from("analytics_events").insert({
        event_name: event,
        properties: props,
        created_at: new Date().toISOString(),
      });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: true });
  }
}
