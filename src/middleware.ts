import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

/**
 * Chỉ match route cần auth redirect. Trang public `/@username` và `/api/track`
 * KHÔNG đi qua middleware để giữ TTFB thấp (không chạy `getUser()`).
 */
export const config = {
  matcher: ["/dashboard", "/dashboard/:path*", "/login", "/signup"],
};
