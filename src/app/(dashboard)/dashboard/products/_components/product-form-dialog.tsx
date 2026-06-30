"use client";

import { useEffect, useRef, useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { isImportableProductUrl } from "@/lib/product-import/import";
import { uploadImage } from "@/lib/storage/upload";
import type { Product, ProductCategory } from "@/lib/types";
import { importProductFromUrl, type ProductInput } from "../actions";

export function ProductFormDialog({
  open,
  onOpenChange,
  initial,
  profileId,
  categories,
  pending,
  error,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial: Product | null;
  profileId: string;
  categories: ProductCategory[];
  pending: boolean;
  error: string | null;
  onSubmit: (input: ProductInput) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90svh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initial ? "Sửa sản phẩm" : "Thêm sản phẩm"}</DialogTitle>
          <DialogDescription>
            Dán link Shopee hoặc TikTok — tên và ảnh sẽ được điền tự động.
          </DialogDescription>
        </DialogHeader>
        {/* Mount lại khi mở → state khởi tạo từ `initial`, không cần effect đồng bộ. */}
        <ProductFormFields
          initial={initial}
          profileId={profileId}
          categories={categories}
          pending={pending}
          error={error}
          onSubmit={onSubmit}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

function ProductFormFields({
  initial,
  profileId,
  categories,
  pending,
  error,
  onSubmit,
  onCancel,
}: {
  initial: Product | null;
  profileId: string;
  categories: ProductCategory[];
  pending: boolean;
  error: string | null;
  onSubmit: (input: ProductInput) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [imageUrl, setImageUrl] = useState<string | null>(initial?.image_url ?? null);
  const [url, setUrl] = useState(initial?.url ?? "");
  const [categoryId, setCategoryId] = useState<string | null>(initial?.category_id ?? null);
  const [isActive, setIsActive] = useState(initial?.is_active ?? true);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importNotice, setImportNotice] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const importTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastImportedUrlRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (importTimerRef.current) clearTimeout(importTimerRef.current);
    };
  }, []);

  function scheduleImport(nextUrl: string) {
    if (importTimerRef.current) clearTimeout(importTimerRef.current);

    const trimmed = nextUrl.trim();
    if (!isImportableProductUrl(trimmed) || trimmed === lastImportedUrlRef.current) {
      return;
    }

    importTimerRef.current = setTimeout(() => {
      void runImport(trimmed);
    }, 700);
  }

  async function runImport(nextUrl: string) {
    if (!isImportableProductUrl(nextUrl)) return;

    setImporting(true);
    setImportError(null);
    setImportNotice(null);
    try {
      const result = await importProductFromUrl(nextUrl);
      if (!result.ok) {
        setImportError(result.message);
        return;
      }

      lastImportedUrlRef.current = nextUrl.trim();
      const data = result.data;
      setTitle(data.title);
      if (data.description) setDescription(data.description);
      if (data.imageUrl) setImageUrl(data.imageUrl);
      setUrl(data.url);
      if (data.imageWarning) setImportNotice(data.imageWarning);
    } finally {
      setImporting(false);
    }
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    try {
      const { url: publicUrl } = await uploadImage(file, "products", profileId);
      setImageUrl(publicUrl);
    } catch (err) {
      setUploadError(
        err instanceof Error ? err.message : "Tải ảnh lên thất bại.",
      );
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit({
      title,
      description: description || null,
      imageUrl,
      price: null,
      currency: "VND",
      categoryId,
      url: url || null,
      isActive,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="product-url">Link Shopee / TikTok</Label>
        <div className="relative">
          <Input
            id="product-url"
            value={url}
            onChange={(e) => {
              const next = e.target.value;
              setUrl(next);
              setImportError(null);
              setImportNotice(null);
              scheduleImport(next);
            }}
            onPaste={(e) => {
              const pasted = e.clipboardData.getData("text");
              if (pasted) scheduleImport(pasted);
            }}
            placeholder="https://shopee.vn/... hoặc https://tiktok.com/..."
            inputMode="url"
            autoFocus
          />
          {importing ? (
            <Loader2 className="absolute top-1/2 right-3 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
          ) : null}
        </div>
        <p className="text-xs text-muted-foreground">
          Dán link sản phẩm — thông tin sẽ tự điền bên dưới (có thể sửa trước khi lưu).
        </p>
        {importError ? (
          <p className="text-xs text-destructive">{importError}</p>
        ) : null}
        {importNotice ? (
          <p className="text-xs text-amber-700 dark:text-amber-400">{importNotice}</p>
        ) : null}
      </div>

      <div className="space-y-1.5">
        <Label>Ảnh sản phẩm</Label>
        <div className="flex items-center gap-3">
          <div className="relative flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-muted">
            {imageUrl ? (
              <>
                <Image
                  src={imageUrl}
                  alt="Ảnh sản phẩm"
                  fill
                  sizes="80px"
                  className="object-cover"
                />
                <button
                  type="button"
                  onClick={() => setImageUrl(null)}
                  className="absolute top-0.5 right-0.5 rounded-full bg-background/90 p-0.5 text-foreground shadow-sm"
                  aria-label="Xoá ảnh"
                >
                  <X className="size-3.5" />
                </button>
              </>
            ) : uploading ? (
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            ) : (
              <ImagePlus className="size-5 text-muted-foreground" />
            )}
          </div>
          <div className="space-y-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={uploading}
              onClick={() => fileRef.current?.click()}
            >
              {uploading ? "Đang tải..." : "Chọn ảnh"}
            </Button>
            <p className="text-xs text-muted-foreground">
              Ảnh được nén tự động trước khi tải lên.
            </p>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFile}
          />
        </div>
        {uploadError ? (
          <p className="text-xs text-destructive">{uploadError}</p>
        ) : null}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="product-title">Tên sản phẩm</Label>
        <Input
          id="product-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Khoá học thiết kế"
          required
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="product-desc">Mô tả</Label>
        <Textarea
          id="product-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Mô tả ngắn gọn về sản phẩm..."
          rows={3}
        />
      </div>

      {categories.length > 0 ? (
        <div className="space-y-1.5">
          <Label htmlFor="product-category">Danh mục</Label>
          <Select
            value={categoryId ?? "none"}
            onValueChange={(v) => setCategoryId(v === "none" ? null : v)}
          >
            <SelectTrigger id="product-category">
              <SelectValue placeholder="Chọn danh mục" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Không phân loại</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : null}

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
        <Button type="submit" size="sm" disabled={pending || uploading || importing}>
          {initial ? "Lưu thay đổi" : "Thêm sản phẩm"}
        </Button>
      </DialogFooter>
    </form>
  );
}
