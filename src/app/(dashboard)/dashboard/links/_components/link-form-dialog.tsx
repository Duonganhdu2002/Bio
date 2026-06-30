"use client";

import { useState } from "react";

import { PlatformIcon } from "@/components/bio/platform";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  detectPlatformFromUrl,
  getPlatformLabel,
  LINK_PLATFORMS,
  type LinkPlatform,
} from "@/lib/links/platforms";
import { cn } from "@/lib/utils";
import type { LinkInput } from "../actions";
import type { Link } from "@/lib/types";

export { LINK_PLATFORMS as PLATFORMS, getPlatformLabel };

export function LinkFormDialog({
  open,
  onOpenChange,
  initial,
  pending,
  error,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial: Link | null;
  pending: boolean;
  error: string | null;
  onSubmit: (input: LinkInput) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{initial ? "Sửa link" : "Thêm link"}</DialogTitle>
          <DialogDescription>
            Chọn nền tảng và dán đường dẫn — link sẽ hiển thị trên trang bio công khai.
          </DialogDescription>
        </DialogHeader>
        {/* Form body chỉ mount khi dialog mở → state khởi tạo lại từ `initial` mỗi lần mở. */}
        <LinkFormFields
          initial={initial}
          pending={pending}
          error={error}
          onSubmit={onSubmit}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

function LinkFormFields({
  initial,
  pending,
  error,
  onSubmit,
  onCancel,
}: {
  initial: Link | null;
  pending: boolean;
  error: string | null;
  onSubmit: (input: LinkInput) => void;
  onCancel: () => void;
}) {
  const [url, setUrl] = useState(initial?.url ?? "");
  const [platform, setPlatform] = useState<LinkPlatform>(
    (initial?.platform as LinkPlatform | null) ?? "website",
  );
  const [isActive, setIsActive] = useState(initial?.is_active ?? true);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit({
      title: getPlatformLabel(platform),
      url,
      platform,
      isActive,
    });
  }

  function handleUrlChange(next: string) {
    setUrl(next);
    if (next.trim()) {
      setPlatform(detectPlatformFromUrl(next));
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Nền tảng</Label>
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
          {LINK_PLATFORMS.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => setPlatform(p.value)}
              aria-pressed={platform === p.value}
              className={cn(
                "flex flex-col items-center gap-1.5 rounded-lg border px-1.5 py-2.5 text-[11px] leading-tight transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
                platform === p.value
                  ? "border-primary bg-primary/5 font-medium text-foreground"
                  : "border-border bg-card text-muted-foreground hover:bg-muted/50",
              )}
            >
              <PlatformIcon platform={p.value} className="size-5 shrink-0" />
              <span className="line-clamp-2 w-full text-center">{p.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="link-url">Đường dẫn</Label>
        <Input
          id="link-url"
          value={url}
          onChange={(e) => handleUrlChange(e.target.value)}
          onPaste={(e) => {
            const pasted = e.clipboardData.getData("text");
            if (pasted) handleUrlChange(pasted);
          }}
          placeholder="https://..."
          inputMode="url"
          autoFocus
          required
        />
      </div>

      <Label className="flex items-center justify-between">
        <span>Hiển thị công khai</span>
        <Switch checked={isActive} onCheckedChange={setIsActive} />
      </Label>

      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={pending}
          onClick={onCancel}
        >
          Huỷ
        </Button>
        <Button type="submit" size="sm" disabled={pending}>
          {initial ? "Lưu thay đổi" : "Thêm link"}
        </Button>
      </DialogFooter>
    </form>
  );
}
