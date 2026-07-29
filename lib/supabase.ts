import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export const hasSupabaseAuth = Boolean(url && publishableKey);

let supabaseClient: SupabaseClient | undefined;

export function getSupabaseClient() {
  if (!url || !publishableKey) throw new Error("Add your Supabase URL and publishable key to .env.");
  supabaseClient ??= createClient(url, publishableKey);
  return supabaseClient;
}

export async function getAuthenticatedUser(request: Request) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token || !url || !publishableKey) return null;
  const client = createClient(url, publishableKey, { auth: { autoRefreshToken: false, persistSession: false } });
  const { data, error } = await client.auth.getUser(token);
  return error ? null : data.user;
}
