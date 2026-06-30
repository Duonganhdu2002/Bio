import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { isSignupEnabled } from "@/lib/auth/signup-enabled";
import { SignUpForm } from "./signup-form";

export const metadata: Metadata = {
  title: "Đăng ký",
  description: "Tạo trang Bio của bạn — chọn tên người dùng và bắt đầu trong vài giây.",
};

export default function SignUpPage() {
  if (!isSignupEnabled()) {
    redirect("/login?notice=signup_closed");
  }

  return <SignUpForm />;
}
