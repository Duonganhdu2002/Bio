import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** Xử lý exchange code → session (email confirm / magic link / oauth sau này). */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  // Chỉ cho phép path nội bộ (bắt đầu "/" nhưng không phải "//...") → chặn open redirect.
  const nextParam = searchParams.get("next");
  const next =
    nextParam && nextParam.startsWith("/") && !nextParam.startsWith("//")
      ? nextParam
      : "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
