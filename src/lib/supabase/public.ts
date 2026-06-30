import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Client Supabase ẩn danh KHÔNG đọc cookie — dành riêng cho trang public `/@username`.
 *
 * Vì sao không dùng `lib/supabase/server.ts`: client đó đọc `cookies()` khiến route bị
 * ép sang dynamic rendering, mất ISR + TTFB thấp. Trang public chỉ gọi RPC
 * `get_public_profile` (granted cho anon) nên không cần session.
 */
export function createPublicClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
