"use server";

import { redirect } from "next/navigation";
import { isSignupEnabled, SIGNUP_DISABLED_MESSAGE } from "@/lib/auth/signup-enabled";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { validateUsername } from "@/lib/validation/username";
import { getAppBaseUrl } from "@/lib/site-url";

export type SignUpState =
  | { status: "idle" }
  | { status: "error"; message: string }
  | { status: "success"; needsConfirmation: boolean };

export async function signUpAction(
  _prev: SignUpState,
  formData: FormData,
): Promise<SignUpState> {
  if (!isSignupEnabled()) {
    return { status: "error", message: SIGNUP_DISABLED_MESSAGE };
  }

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const usernameRaw = String(formData.get("username") ?? "");

  if (!email) {
    return { status: "error", message: "Vui lòng nhập email." };
  }
  if (password.length < 6) {
    return { status: "error", message: "Mật khẩu phải có ít nhất 6 ký tự." };
  }

  const validation = validateUsername(usernameRaw);
  if (!validation.ok) {
    return { status: "error", message: validation.message };
  }
  const username = validation.username;

  // Dùng service role để check + tạo profile, không phụ thuộc RLS của Agent 2.
  const admin = createAdminClient();

  const { data: taken, error: checkErr } = await admin
    .from("profiles")
    .select("id")
    .eq("username", username)
    .maybeSingle();
  if (checkErr) {
    return {
      status: "error",
      message: "Không kiểm tra được tên người dùng. Vui lòng thử lại.",
    };
  }
  if (taken) {
    return {
      status: "error",
      message: "Tên người dùng đã có người sử dụng, hãy chọn tên khác.",
    };
  }

  const supabase = await createClient();
  const { data, error: signErr } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${getAppBaseUrl()}/auth/callback`,
    },
  });

  if (signErr) {
    const msg = signErr.message.toLowerCase();
    if (msg.includes("already") || msg.includes("registered")) {
      return { status: "error", message: "Email này đã được đăng ký. Hãy đăng nhập." };
    }
    return { status: "error", message: "Không tạo được tài khoản. Vui lòng thử lại." };
  }

  const user = data.user;
  if (!user) {
    return { status: "error", message: "Không tạo được tài khoản. Vui lòng thử lại." };
  }
  // Supabase trả user với identities rỗng khi email đã tồn tại (chống dò email).
  if (user.identities && user.identities.length === 0) {
    return { status: "error", message: "Email này đã được đăng ký. Hãy đăng nhập." };
  }

  const { error: insertErr } = await admin
    .from("profiles")
    .insert({ id: user.id, username });
  if (insertErr) {
    // Auth user vừa tạo nhưng không có profile → "mồ côi": không vào được dashboard
    // (layout đá về /login) và email bị chiếm nên không đăng ký lại được.
    // Self-heal: rollback user vừa tạo để người dùng thử lại sạch sẽ.
    // Chỉ xảy ra ở luồng signup (nơi duy nhất tạo auth user), nên xử lý gọn tại đây.
    await admin.auth.admin.deleteUser(user.id).catch(() => {
      /* best-effort: nếu xóa lỗi, follow-up vẫn có thể tự khôi phục ở settings */
    });
    if (insertErr.code === "23505") {
      return {
        status: "error",
        message: "Tên người dùng đã có người sử dụng, hãy chọn tên khác.",
      };
    }
    return { status: "error", message: "Không tạo được hồ sơ. Vui lòng thử lại." };
  }

  // Email confirm tắt → có session ngay → vào dashboard. Bật → yêu cầu xác nhận email.
  if (data.session) {
    redirect("/dashboard");
  }
  return { status: "success", needsConfirmation: true };
}
