/**
 * Validate URL ảnh do client gửi lên (avatar / ảnh sản phẩm).
 *
 * UI chỉ upload ảnh qua Supabase Storage (xem `lib/storage/upload.ts`), nên server
 * chỉ chấp nhận URL public của chính project Supabase. Mục đích: chặn lưu URL tùy ý
 * rồi render qua `next/image` (tránh SSRF / lạm dụng image optimizer).
 */

function supabaseHost(): string | null {
  try {
    return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").host;
  } catch {
    return null;
  }
}

export function isStorageImageUrl(raw: string): boolean {
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    return false;
  }
  if (parsed.protocol !== "https:") return false;

  const host = supabaseHost();
  if (host) {
    if (parsed.host !== host) return false;
  } else if (!parsed.hostname.endsWith(".supabase.co")) {
    return false;
  }

  return parsed.pathname.startsWith("/storage/v1/object/public/");
}

/**
 * Chuẩn hoá URL ảnh: trả URL hợp lệ, `null` khi rỗng. Ném khi URL không hợp lệ
 * để server action trả lỗi nghiệp vụ (không lưu URL lạ vào DB).
 */
export function sanitizeImageUrl(raw: string | null | undefined): string | null {
  const value = raw?.trim();
  if (!value) return null;
  if (!isStorageImageUrl(value)) {
    throw new Error("Ảnh không hợp lệ.");
  }
  return value;
}
