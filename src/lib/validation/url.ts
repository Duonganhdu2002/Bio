/**
 * Chuẩn hoá + validate URL cho links/products. Chỉ chấp nhận http/https
 * (chặn `javascript:`, `data:`, `file:`, ... để tránh XSS khi render link công khai).
 */

export type UrlValidation =
  | { ok: true; url: string }
  | { ok: false; message: string };

/**
 * Trả về URL đã chuẩn hoá nếu hợp lệ. Tự thêm `https://` khi người dùng
 * gõ thiếu protocol (vd: `example.com`).
 */
export function normalizeUrl(raw: string): UrlValidation {
  const trimmed = raw.trim();
  if (trimmed.length === 0) {
    return { ok: false, message: "Vui lòng nhập đường dẫn." };
  }

  // Thêm protocol mặc định nếu người dùng bỏ qua (nhưng không nhầm với scheme khác).
  const hasScheme = /^[a-z][a-z0-9+.-]*:/i.test(trimmed);
  const candidate = hasScheme ? trimmed : `https://${trimmed}`;

  let parsed: URL;
  try {
    parsed = new URL(candidate);
  } catch {
    return { ok: false, message: "Đường dẫn không hợp lệ." };
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return {
      ok: false,
      message: "Chỉ chấp nhận đường dẫn http hoặc https.",
    };
  }

  if (!parsed.hostname || !parsed.hostname.includes(".")) {
    return { ok: false, message: "Tên miền không hợp lệ." };
  }

  return { ok: true, url: parsed.toString() };
}

export function isValidUrl(raw: string): boolean {
  return normalizeUrl(raw).ok;
}
