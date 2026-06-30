export const USERNAME_MIN_LENGTH = 3;
export const USERNAME_MAX_LENGTH = 30;

/** Chữ thường, số và dấu gạch dưới. Khớp với ràng buộc `citext` của `profiles.username`. */
const USERNAME_PATTERN = /^[a-z0-9_]+$/;

/** Tên trùng route reserved hoặc dễ gây nhầm lẫn — không cho người dùng đăng ký. */
const RESERVED_USERNAMES = new Set([
  "login",
  "signup",
  "signin",
  "signout",
  "logout",
  "register",
  "auth",
  "api",
  "dashboard",
  "settings",
  "admin",
  "root",
  "support",
  "help",
  "about",
  "terms",
  "privacy",
  "explore",
  "app",
  "www",
  "me",
  "user",
  "users",
  "profile",
  "profiles",
  "bio",
  "static",
  "assets",
  "public",
  "favicon",
]);

export type UsernameValidation =
  | { ok: true; username: string }
  | { ok: false; message: string };

/** Chuẩn hoá về dạng lưu trong DB (lowercase, bỏ khoảng trắng, bỏ `@` đầu nếu có). */
export function normalizeUsername(raw: string): string {
  return raw.trim().toLowerCase().replace(/^@/, "");
}

export function validateUsername(raw: string): UsernameValidation {
  const username = normalizeUsername(raw);

  if (username.length === 0) {
    return { ok: false, message: "Vui lòng nhập tên người dùng." };
  }
  if (username.length < USERNAME_MIN_LENGTH) {
    return {
      ok: false,
      message: `Tên người dùng phải có ít nhất ${USERNAME_MIN_LENGTH} ký tự.`,
    };
  }
  if (username.length > USERNAME_MAX_LENGTH) {
    return {
      ok: false,
      message: `Tên người dùng tối đa ${USERNAME_MAX_LENGTH} ký tự.`,
    };
  }
  if (!USERNAME_PATTERN.test(username)) {
    return {
      ok: false,
      message: "Chỉ dùng chữ thường, số và dấu gạch dưới (a–z, 0–9, _).",
    };
  }
  if (RESERVED_USERNAMES.has(username)) {
    return {
      ok: false,
      message: "Tên người dùng này đã được hệ thống giữ chỗ, hãy chọn tên khác.",
    };
  }

  return { ok: true, username };
}
