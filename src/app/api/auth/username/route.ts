import { NextResponse } from "next/server";
import { isSignupEnabled, SIGNUP_DISABLED_MESSAGE } from "@/lib/auth/signup-enabled";
import { createAdminClient } from "@/lib/supabase/admin";
import { validateUsername } from "@/lib/validation/username";
import { clientIp, isRateLimited } from "@/lib/rate-limit";

// Endpoint công khai chạy bằng service role → rate-limit theo IP chống dò username / đẩy tải DB.
const WINDOW_SECONDS = 10;
const MAX_HITS = 20;

/** Kiểm tra tên người dùng có khả dụng không (gọi từ form signup, debounce client). */
export async function GET(request: Request) {
  if (!isSignupEnabled()) {
    return NextResponse.json(
      { available: false, reason: "disabled", message: SIGNUP_DISABLED_MESSAGE },
      { status: 403 },
    );
  }

  if (await isRateLimited(`username:${clientIp(request.headers)}`, MAX_HITS, WINDOW_SECONDS)) {
    return NextResponse.json(
      { available: false, reason: "rate_limited", message: "Bạn thao tác quá nhanh. Thử lại sau." },
      { status: 429 },
    );
  }

  const { searchParams } = new URL(request.url);
  const raw = searchParams.get("u") ?? "";

  const validation = validateUsername(raw);
  if (!validation.ok) {
    return NextResponse.json({
      available: false,
      reason: "invalid",
      message: validation.message,
    });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("profiles")
    .select("id")
    .eq("username", validation.username)
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      { available: false, reason: "error", message: "Không kiểm tra được tên người dùng." },
      { status: 500 },
    );
  }

  return NextResponse.json({
    available: !data,
    username: validation.username,
  });
}
