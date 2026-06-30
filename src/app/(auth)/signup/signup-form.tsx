"use client";

import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
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
import { normalizeUsername, validateUsername } from "@/lib/validation/username";
import { signUpAction, type SignUpState } from "./actions";

type Availability =
  | { state: "idle" }
  | { state: "checking" }
  | { state: "invalid"; message: string }
  | { state: "available" }
  | { state: "taken" }
  | { state: "error" };

const initialState: SignUpState = { status: "idle" };

export function SignUpForm() {
  const [state, formAction, isPending] = useActionState(signUpAction, initialState);
  const [username, setUsername] = useState("");
  // Kết quả kiểm tra từ server, gắn với giá trị username đã hỏi (tránh race khi gõ nhanh).
  const [remote, setRemote] = useState<{
    for: string;
    state: "available" | "taken" | "error";
  } | null>(null);

  const normalized = normalizeUsername(username);
  const validation = normalized.length > 0 ? validateUsername(normalized) : null;

  useEffect(() => {
    if (!validation?.ok) return;
    const target = validation.username;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/auth/username?u=${encodeURIComponent(target)}`, {
          signal: controller.signal,
        });
        const data = (await res.json()) as { available?: boolean };
        setRemote({ for: target, state: data.available ? "available" : "taken" });
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          setRemote({ for: target, state: "error" });
        }
      }
    }, 350);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
    // validation.ok/username phụ thuộc normalized → dùng normalized làm dep ổn định.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [normalized]);

  let availability: Availability;
  if (normalized.length === 0) {
    availability = { state: "idle" };
  } else if (validation && !validation.ok) {
    availability = { state: "invalid", message: validation.message };
  } else if (remote && remote.for === normalized) {
    availability =
      remote.state === "available"
        ? { state: "available" }
        : remote.state === "taken"
          ? { state: "taken" }
          : { state: "error" };
  } else {
    availability = { state: "checking" };
  }

  if (state.status === "success") {
    return (
      <Card className="relative mx-auto w-full max-w-md shadow-md ring-1 ring-border">
        <CardHeader className="text-center sm:text-left">
          <CardTitle className="text-2xl">Kiểm tra email của bạn</CardTitle>
          <CardDescription>
            Chúng tôi đã gửi link xác nhận. Mở email để kích hoạt tài khoản rồi đăng nhập.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button render={<Link href="/login" />} className="w-full" size="lg">
            Tới trang đăng nhập
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="relative mx-auto w-full max-w-md shadow-md ring-1 ring-border">
      <CardHeader className="text-center sm:text-left">
        <CardTitle className="text-2xl">Tạo trang Bio</CardTitle>
        <CardDescription>
          Chọn tên người dùng để có đường link <span className="font-medium">/@username</span> của riêng bạn.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="flex flex-col gap-4">
          {state.status === "error" && (
            <Alert variant="destructive">
              <AlertDescription>{state.message}</AlertDescription>
            </Alert>
          )}

          <div className="grid gap-2">
            <Label htmlFor="signup-username">Tên người dùng</Label>
            <div className="flex items-center rounded-lg border border-input bg-transparent pl-2.5 transition-colors focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 dark:bg-input/30">
              <span className="text-sm text-muted-foreground select-none">/@</span>
              <Input
                id="signup-username"
                name="username"
                required
                autoComplete="off"
                autoCapitalize="off"
                spellCheck={false}
                placeholder="tencuaban"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="h-8 border-0 bg-transparent px-1 focus-visible:border-0 focus-visible:ring-0 dark:bg-transparent"
                aria-invalid={availability.state === "taken" || availability.state === "invalid"}
              />
            </div>
            <UsernameHint availability={availability} />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="signup-email">Email</Label>
            <Input
              id="signup-email"
              name="email"
              type="email"
              required
              autoComplete="email"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="signup-password">Mật khẩu</Label>
            <Input
              id="signup-password"
              name="password"
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
            />
            <p className="text-xs text-muted-foreground">Tối thiểu 6 ký tự.</p>
          </div>

          <Button
            type="submit"
            className="mt-1 w-full"
            size="lg"
            disabled={isPending || availability.state === "taken" || availability.state === "invalid"}
          >
            {isPending ? "Đang tạo tài khoản…" : "Tạo tài khoản"}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Đã có tài khoản?{" "}
            <Link
              href="/login"
              className="font-medium text-violet-600 hover:underline dark:text-violet-400"
            >
              Đăng nhập
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}

function UsernameHint({ availability }: { availability: Availability }) {
  switch (availability.state) {
    case "checking":
      return <p className="text-xs text-muted-foreground">Đang kiểm tra…</p>;
    case "available":
      return <p className="text-xs text-emerald-600 dark:text-emerald-400">Tên người dùng khả dụng.</p>;
    case "taken":
      return <p className="text-xs text-destructive">Tên người dùng đã có người sử dụng.</p>;
    case "invalid":
      return <p className="text-xs text-destructive">{availability.message}</p>;
    case "error":
      return <p className="text-xs text-muted-foreground">Không kiểm tra được, thử lại sau.</p>;
    default:
      return null;
  }
}
