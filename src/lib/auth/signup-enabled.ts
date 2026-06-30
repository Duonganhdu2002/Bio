/** Bật đăng ký công khai — mặc định tắt. Đặt `SIGNUP_ENABLED=true` để mở lại. */
export function isSignupEnabled(): boolean {
  return process.env.SIGNUP_ENABLED === "true";
}

export const SIGNUP_DISABLED_MESSAGE =
  "Hiện chưa mở đăng ký tài khoản mới. Vui lòng đăng nhập nếu bạn đã có tài khoản.";
