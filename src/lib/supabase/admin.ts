import { createClient } from "@supabase/supabase-js";

/** Only call from Route Handlers / Server Actions — do not import into client code. */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key || key.startsWith("REPLACE_WITH")) {
    throw new Error(
      "Missing/placeholder SUPABASE_SERVICE_ROLE_KEY — set the real service role (secret) key in .env.local and restart the dev server.",
    );
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
