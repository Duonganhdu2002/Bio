"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Check, Loader2, X } from "lucide-react";

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
import { Switch } from "@/components/ui/switch";
import { ConfirmDialog } from "@/components/dashboard/confirm-dialog";
import { signOut } from "@/lib/auth-actions";
import { normalizeUsername } from "@/lib/validation/username";
import type { Profile } from "@/lib/types";
import { deleteAccount, togglePublished, updateUsername } from "../actions";

type Availability =
  | { state: "idle" }
  | { state: "checking" }
  | { state: "current" }
  | { state: "available" }
  | { state: "taken"; message: string };

type CheckResult =
  | { state: "available" }
  | { state: "taken"; message: string }
  | { state: "idle" };

export function SettingsForm({ profile }: { profile: Profile }) {
  const router = useRouter();
  const [username, setUsername] = useState(profile.username);
  // Kết quả fetch gắn với chính chuỗi đã kiểm tra (`for`); khác chuỗi hiện tại
  // nghĩa là đang chờ → hiển thị "checking" (suy ở render, không setState trong effect).
  const [check, setCheck] = useState<{ for: string; result: CheckResult } | null>(
    null,
  );
  const [usernameMsg, setUsernameMsg] = useState<
    { type: "ok" | "error"; text: string } | null
  >(null);
  const [savingUsername, startSaveUsername] = useTransition();

  const [isPublished, setIsPublished] = useState(profile.is_published);
  const [publishPending, startPublish] = useTransition();
  const [publishError, setPublishError] = useState<string | null>(null);

  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, startDelete] = useTransition();

  const normalized = normalizeUsername(username);
  const usernameUnchanged = normalized === profile.username;

  const availability: Availability = usernameUnchanged
    ? { state: "current" }
    : check && check.for === normalized
      ? check.result
      : { state: "checking" };

  useEffect(() => {
    // Chỉ giữ effect cho phần bất đồng bộ (debounce + fetch huỷ được); trạng thái
    // "current"/"checking" được suy ở render nên không setState đồng bộ trong effect.
    if (normalized === profile.username) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/auth/username?u=${encodeURIComponent(normalized)}`,
          { signal: controller.signal },
        );
        const data = (await res.json()) as {
          available: boolean;
          message?: string;
        };
        setCheck({
          for: normalized,
          result: data.available
            ? { state: "available" }
            : {
                state: "taken",
                message: data.message ?? "Tên người dùng đã được sử dụng.",
              },
        });
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          setCheck({ for: normalized, result: { state: "idle" } });
        }
      }
    }, 400);
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [normalized, profile.username]);

  function handleSaveUsername(e: React.FormEvent) {
    e.preventDefault();
    setUsernameMsg(null);
    startSaveUsername(async () => {
      const res = await updateUsername(username);
      if (res.ok) {
        setUsernameMsg({ type: "ok", text: "Đã đổi tên người dùng." });
        router.refresh();
      } else {
        setUsernameMsg({ type: "error", text: res.message });
      }
    });
  }

  function handleTogglePublish(next: boolean) {
    setPublishError(null);
    setIsPublished(next);
    startPublish(async () => {
      const res = await togglePublished(next);
      if (!res.ok) {
        setIsPublished(!next);
        setPublishError(res.message);
      } else {
        router.refresh();
      }
    });
  }

  const canSaveUsername =
    !usernameUnchanged && availability.state === "available" && !savingUsername;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Tên người dùng</CardTitle>
          <CardDescription>
            Đường dẫn công khai của bạn là{" "}
            <span className="text-foreground">/@{profile.username}</span>.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveUsername} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="username">Tên người dùng</Label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">/@</span>
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="max-w-xs"
                  autoComplete="off"
                />
                {availability.state === "checking" ? (
                  <Loader2 className="size-4 animate-spin text-muted-foreground" />
                ) : availability.state === "available" ? (
                  <Check className="size-4 text-primary" />
                ) : availability.state === "taken" ? (
                  <X className="size-4 text-destructive" />
                ) : null}
              </div>
              {availability.state === "taken" ? (
                <p className="text-xs text-destructive">{availability.message}</p>
              ) : null}
            </div>

            {!usernameUnchanged ? (
              <Alert>
                <AlertTriangle />
                <AlertDescription>
                  Đổi tên người dùng sẽ thay đổi đường dẫn công khai. Các liên kết cũ tới{" "}
                  <span className="text-foreground">/@{profile.username}</span> sẽ không còn hoạt động.
                </AlertDescription>
              </Alert>
            ) : null}

            {usernameMsg ? (
              <Alert variant={usernameMsg.type === "error" ? "destructive" : "default"}>
                <AlertDescription>{usernameMsg.text}</AlertDescription>
              </Alert>
            ) : null}

            <Button type="submit" size="sm" disabled={!canSaveUsername}>
              {savingUsername ? "Đang lưu..." : "Đổi tên người dùng"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Xuất bản</CardTitle>
          <CardDescription>
            Khi tắt, trang bio sẽ không hiển thị công khai với người khác.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <Label className="flex items-center justify-between">
            <span>Hiển thị trang bio công khai</span>
            <Switch
              checked={isPublished}
              disabled={publishPending}
              onCheckedChange={handleTogglePublish}
            />
          </Label>
          {publishError ? (
            <p className="text-xs text-destructive">{publishError}</p>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tài khoản</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <form action={signOut}>
            <Button type="submit" variant="outline" size="sm">
              Đăng xuất
            </Button>
          </form>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={() => setConfirmDelete(true)}
          >
            Xoá tài khoản
          </Button>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Xoá tài khoản vĩnh viễn?"
        description="Toàn bộ profile, links, sản phẩm và số liệu thống kê sẽ bị xoá và không thể khôi phục."
        confirmLabel={deleting ? "Đang xoá..." : "Xoá tài khoản"}
        pending={deleting}
        onConfirm={() => {
          startDelete(async () => {
            await deleteAccount();
          });
        }}
      />
    </div>
  );
}
