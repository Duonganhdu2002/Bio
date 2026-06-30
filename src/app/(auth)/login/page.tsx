import type { Metadata } from "next";
import { Suspense } from "react";
import { isSignupEnabled } from "@/lib/auth/signup-enabled";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Đăng nhập",
  description: "Đăng nhập vào Bio để quản lý trang link cá nhân của bạn.",
};

export default function LoginPage() {
  const signupEnabled = isSignupEnabled();

  return (
    <Suspense
      fallback={
        <div className="relative text-sm text-muted-foreground">Đang tải…</div>
      }
    >
      <LoginForm signupEnabled={signupEnabled} />
    </Suspense>
  );
}
