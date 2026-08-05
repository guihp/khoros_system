import { createClient } from "@supabase/supabase-js";

/**
 * Server-side Supabase client for CMS media proxy / leads.
 * Prefers secret/service key; falls back to publishable (RLS still applies).
 */
export function createSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key =
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) return null;

  return createClient(url, key);
}

export interface LeadRecord {
  name: string;
  email: string;
  city: string;
  article_category?: string;
  article_slug?: string;
  article_title?: string;
  consent: boolean;
  source?: string;
}
