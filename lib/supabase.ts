import { createClient, type PostgrestError, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ?? "";

export function isSupabaseConfigured(): boolean {
  return supabaseUrl.length > 0 && supabaseKey.length > 0;
}

let client: SupabaseClient | null = null;

/**
 * Returns the shared Supabase client. The publishable (anon) key is safe to
 * expose; all authorization is enforced by Row Level Security in the database.
 */
export function getSupabase(): SupabaseClient {
  if (!isSupabaseConfigured()) {
    throw new Error(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.",
    );
  }
  if (!client) {
    client = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return client;
}

/**
 * Throws a descriptive error when a PostgREST operation fails, so callers can
 * rely on a plain try/catch instead of inspecting the result object.
 */
export function throwIfError(error: PostgrestError | null, context: string): void {
  if (error) {
    throw new Error(`${context}: ${error.message}`);
  }
}
