"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SIGNUP_DISABLED_MESSAGE } from "@/lib/auth/signup-enabled";

export function LoginForm({ signupEnabled }: { signupEnabled: boolean }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const err = searchParams.get("error");
  const notice = searchParams.get("notice");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setLoading(true);
    const supabase = createClient();

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setLoading(false);
    if (error) {
      setMessage("Email hoặc mật khẩu không đúng.");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <Card className="relative mx-auto w-full max-w-md shadow-md ring-1 ring-border">
      <CardHeader className="text-center sm:text-left">
        <CardTitle className="text-2xl">Đăng nhập Bio</CardTitle>
        <CardDescription>
          Đăng nhập để quản lý trang link cá nhân của bạn.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          {err === "auth" && (
            <Alert variant="destructive">
              <AlertDescription>
                Xác thực thất bại. Vui lòng đăng nhập lại.
              </AlertDescription>
            </Alert>
          )}
          {notice === "signup_closed" && (
            <Alert>
              <AlertDescription>{SIGNUP_DISABLED_MESSAGE}</AlertDescription>
            </Alert>
          )}
          {message && (
            <Alert variant="destructive">
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}

          <div className="grid gap-2">
            <Label htmlFor="login-email">Email</Label>
            <Input
              id="login-email"
              name="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="login-password">Mật khẩu</Label>
            <Input
              id="login-password"
              name="password"
              type="password"
              required
              minLength={6}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <Button type="submit" className="mt-1 w-full" size="lg" disabled={loading}>
            {loading ? "Đang đăng nhập…" : "Đăng nhập"}
          </Button>

          {signupEnabled ? (
            <p className="text-center text-sm text-muted-foreground">
              Chưa có tài khoản?{" "}
              <Link
                href="/signup"
                className="font-medium text-violet-600 hover:underline dark:text-violet-400"
              >
                Đăng ký
              </Link>
            </p>
          ) : null}
        </form>
      </CardContent>
    </Card>
  );
}
