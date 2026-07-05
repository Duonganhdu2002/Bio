import { after } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { parseDevice } from "@/lib/analytics/device";
import { clientIp, isRateLimited } from "@/lib/rate-limit";

// Edge runtime: gần người dùng, khởi động nhanh, trả 204 trong vài chục ms.
export const runtime = "edge";

// Payload chốt theo contract: camelCase. Mọi client (`lib/analytics/track-client.ts`)
// gửi đúng kiểu này; không còn chấp nhận snake_case.
type TrackBody = {
  profileId?: string;
  type?: "page_view" | "click";
  targetType?: "link" | "product" | "banner";
  targetId?: string;
  referrer?: string;
};

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Rate-limit theo IP + profile. Chia sẻ giữa instance khi có Upstash, ngược lại in-memory.
const WINDOW_SECONDS = 10;
const MAX_HITS = 40;

const ok204 = () => new Response(null, { status: 204 });

export async function POST(request: Request) {
  let body: TrackBody;
  try {
    // sendBeacon gửi Blob text/plain → đọc text rồi parse, không phụ thuộc Content-Type.
    body = JSON.parse(await request.text()) as TrackBody;
  } catch {
    return ok204();
  }

  const { profileId, type } = body;
  // Im lặng (vẫn 204) với input xấu: tracking là fire-and-forget, không báo lỗi cho client.
  if (
    !profileId ||
    !UUID_RE.test(profileId) ||
    (type !== "page_view" && type !== "click")
  ) {
    return ok204();
  }

  const ip = clientIp(request.headers);

  const country =
    request.headers.get("x-vercel-ip-country") ||
    request.headers.get("cf-ipcountry") ||
    null;
  const referrer = body.referrer || request.headers.get("referer") || null;
  const device = parseDevice(request.headers.get("user-agent"));

  const targetType =
    body.targetType === "link" ||
    body.targetType === "product" ||
    body.targetType === "banner"
      ? body.targetType
      : null;
  const targetId =
    body.targetId && UUID_RE.test(body.targetId) ? body.targetId : null;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );

  // Trả 204 ngay; rate-limit + ghi DB chạy nền sau response để giữ TTFB thấp.
  // track_event là SECURITY DEFINER → anon đủ quyền.
  after(async () => {
    if (await isRateLimited(`track:${ip}:${profileId}`, MAX_HITS, WINDOW_SECONDS)) {
      return;
    }
    await supabase.rpc("track_event", {
      p_profile_id: profileId,
      p_type: type,
      p_target_type: targetType,
      p_target_id: targetId,
      p_referrer: referrer,
      p_country: country,
      p_device: device,
    });
  });

  return ok204();
}
