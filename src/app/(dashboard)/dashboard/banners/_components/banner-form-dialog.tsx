"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { ImagePlus, Loader2, X } from "lucide-react";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { BANNER_SECTIONS, type BannerSection } from "@/lib/banner-section";
import { uploadImage } from "@/lib/storage/upload";
import type { ProfileBanner } from "@/lib/types";
import type { BannerInput } from "../actions";

export function BannerFormDialog({
  open,
  onOpenChange,
  initial,
  profileId,
  defaultSection = "for_you",
  pending,
  error,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial: ProfileBanner | null;
  profileId: string;
  defaultSection?: BannerSection;
  pending: boolean;
  error: string | null;
  onSubmit: (input: BannerInput) => void;
}) {
  const section = initial?.section ?? defaultSection;
  const isBrand = section === "brand";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90svh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {initial
              ? isBrand
                ? "Sửa brand"
                : "Sửa banner PR"
              : isBrand
                ? "Thêm brand"
                : "Thêm banner PR"}
          </DialogTitle>
          <DialogDescription>
            {isBrand
              ? "Tên thương hiệu và logo — dùng chung cho banner và gán sản phẩm."
              : "Tải ảnh và đặt tên chiến dịch (ví dụ: Niềng răng, Bệnh viện ABC)."}
          </DialogDescription>
        </DialogHeader>
        <BannerFormFields
          key={`${initial?.id ?? "new"}-${section}`}
          initial={initial}
          profileId={profileId}
          defaultSection={defaultSection}
          isBrand={isBrand}
          pending={pending}
          error={error}
          onSubmit={onSubmit}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

function BannerFormFields({
  initial,
  profileId,
  defaultSection,
  isBrand,
  pending,
  error,
  onSubmit,
  onCancel,
}: {
  initial: ProfileBanner | null;
  profileId: string;
  defaultSection: BannerSection;
  isBrand: boolean;
  pending: boolean;
  error: string | null;
  onSubmit: (input: BannerInput) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [section, setSection] = useState<BannerSection>(
    isBrand ? "brand" : (initial?.section ?? defaultSection),
  );
  const [imageUrl, setImageUrl] = useState<string | null>(initial?.image_url ?? null);
  const [url, setUrl] = useState(initial?.url ?? "");
  const [isActive, setIsActive] = useState(initial?.is_active ?? true);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    try {
      const { url: publicUrl } = await uploadImage(file, "banners", profileId);
      setImageUrl(publicUrl);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Tải ảnh lên thất bại.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit({
      name,
      imageUrl: imageUrl ?? "",
      url: isBrand ? null : url.trim() || null,
      section: isBrand ? "brand" : section,
      isActive: isBrand ? (initial?.is_active ?? true) : isActive,
    });
  }

  if (isBrand) {
    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="brand-name">Tên brand</Label>
          <Input
            id="brand-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Roborock, Joyoung, Bear..."
            autoFocus
            required
          />
        </div>

        <div className="space-y-1.5">
          <Label>Ảnh brand</Label>
          {imageUrl ? (
            <div className="relative mx-auto aspect-square w-full max-w-40 overflow-hidden rounded-xl border border-border bg-muted">
              <Image src={imageUrl} alt="" fill className="object-contain p-2" sizes="160px" />
              <Button
                type="button"
                variant="secondary"
                size="icon-sm"
                className="absolute top-2 right-2"
                onClick={() => setImageUrl(null)}
                aria-label="Xoá ảnh"
              >
                <X />
              </Button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="mx-auto flex aspect-square w-full max-w-40 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-muted/40 text-sm text-muted-foreground transition-colors hover:bg-muted/70 disabled:opacity-60"
            >
              {uploading ? (
                <Loader2 className="size-5 animate-spin" />
              ) : (
                <ImagePlus className="size-5" />
              )}
              {uploading ? "Đang tải lên..." : "Chọn ảnh brand"}
            </button>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleFile}
          />
          {uploadError ? (
            <p className="text-xs text-destructive">{uploadError}</p>
          ) : null}
        </div>

        {error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        <DialogFooter>
          <Button type="button" variant="outline" size="sm" disabled={pending} onClick={onCancel}>
            Huỷ
          </Button>
          <Button type="submit" size="sm" disabled={pending || uploading || !imageUrl}>
            {initial ? "Lưu thay đổi" : "Thêm brand"}
          </Button>
        </DialogFooter>
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="banner-name">Tên chiến dịch</Label>
        <Input
          id="banner-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Niềng răng — Khuyến mãi tháng 6"
          autoFocus
          required
        />
      </div>

      <div className="space-y-1.5">
        <Label>Vị trí hiển thị</Label>
        <Select value={section} onValueChange={(v) => setSection(v as BannerSection)}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {BANNER_SECTIONS.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          {BANNER_SECTIONS.find((item) => item.value === section)?.description}
        </p>
      </div>

      <div className="space-y-1.5">
        <Label>Ảnh banner</Label>
        {imageUrl ? (
          <div className="relative aspect-[16/9] overflow-hidden rounded-md border border-border bg-muted">
            <Image src={imageUrl} alt="" fill className="object-cover" sizes="400px" />
            <Button
              type="button"
              variant="secondary"
              size="icon-sm"
              className="absolute top-2 right-2"
              onClick={() => setImageUrl(null)}
              aria-label="Xoá ảnh"
            >
              <X />
            </Button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="flex aspect-[16/9] w-full flex-col items-center justify-center gap-2 rounded-md border border-dashed border-border bg-muted/40 text-sm text-muted-foreground transition-colors hover:bg-muted/70 disabled:opacity-60"
          >
            {uploading ? (
              <Loader2 className="size-5 animate-spin" />
            ) : (
              <ImagePlus className="size-5" />
            )}
            {uploading ? "Đang tải lên..." : "Chọn ảnh banner"}
          </button>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleFile}
        />
        {uploadError ? (
          <p className="text-xs text-destructive">{uploadError}</p>
        ) : null}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="banner-url">Liên kết (tuỳ chọn)</Label>
        <Input
          id="banner-url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://..."
          inputMode="url"
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
        <Button type="button" variant="outline" size="sm" disabled={pending} onClick={onCancel}>
          Huỷ
        </Button>
        <Button type="submit" size="sm" disabled={pending || uploading || !imageUrl}>
          {initial ? "Lưu thay đổi" : "Thêm banner"}
        </Button>
      </DialogFooter>
    </form>
  );
}
