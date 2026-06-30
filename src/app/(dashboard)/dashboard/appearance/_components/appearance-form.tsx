"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2 } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  BIO_TEMPLATE_KEYS,
  BIO_TEMPLATE_META,
  resolveBioTemplate,
} from "@/components/bio/theme";
import { TemplateThumb } from "@/components/bio/template-visuals";
import { uploadImage } from "@/lib/storage/upload";
import { cn } from "@/lib/utils";
import type { Profile } from "@/lib/types";
import { updateAppearance } from "../actions";
import { AppearancePreview } from "./appearance-preview";

const TEMPLATE_LABELS = BIO_TEMPLATE_META;

export function AppearanceForm({ profile }: { profile: Profile }) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState(profile.display_name ?? "");
  const [bio, setBio] = useState(profile.bio ?? "");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(profile.avatar_url);
  const [coverUrl, setCoverUrl] = useState<string | null>(profile.cover_url ?? null);
  const [template, setTemplate] = useState(profile.template || "stack");
  const [uploading, setUploading] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [message, setMessage] = useState<
    { type: "ok" | "error"; text: string } | null
  >(null);
  const [pending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);
  const coverRef = useRef<HTMLInputElement>(null);

  const initial =
    (displayName.trim() || profile.username).trim()[0]?.toUpperCase() ?? "?";

  async function handleAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setMessage(null);
    try {
      const { url } = await uploadImage(file, "avatars", profile.id);
      setAvatarUrl(url);
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Tải ảnh lên thất bại.",
      });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function handleCover(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingCover(true);
    setMessage(null);
    try {
      const { url } = await uploadImage(file, "covers", profile.id);
      setCoverUrl(url);
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Tải ảnh nền thất bại.",
      });
    } finally {
      setUploadingCover(false);
      if (coverRef.current) coverRef.current.value = "";
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    startTransition(async () => {
      const res = await updateAppearance({
        displayName: displayName || null,
        bio: bio || null,
        avatarUrl,
        coverUrl,
        template,
      });
      if (res.ok) {
        setMessage({ type: "ok", text: "Đã lưu thay đổi." });
        router.refresh();
      } else {
        setMessage({ type: "error", text: res.message });
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 lg:grid-cols-[1fr_20rem]">
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Thông tin hiển thị</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Avatar size="lg">
                {avatarUrl ? (
                  <AvatarImage src={avatarUrl} alt={profile.username} />
                ) : null}
                <AvatarFallback>{initial}</AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={uploading}
                  onClick={() => fileRef.current?.click()}
                >
                  {uploading ? (
                    <>
                      <Loader2 className="animate-spin" />
                      Đang tải...
                    </>
                  ) : (
                    "Đổi ảnh đại diện"
                  )}
                </Button>
                {avatarUrl ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => setAvatarUrl(null)}
                  >
                    Xoá ảnh
                  </Button>
                ) : null}
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatar}
              />
            </div>

            <div className="space-y-2">
              <Label>Ảnh nền cửa hàng</Label>
              <div className="overflow-hidden rounded-lg border border-border bg-muted/40">
                <div className="relative aspect-[3/1] w-full bg-muted">
                  {coverUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={coverUrl}
                      alt="Xem trước ảnh nền"
                      className="size-full object-cover"
                    />
                  ) : (
                    <div className="flex size-full items-center justify-center text-xs text-muted-foreground">
                      Chưa có ảnh nền
                    </div>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={uploadingCover}
                  onClick={() => coverRef.current?.click()}
                >
                  {uploadingCover ? (
                    <>
                      <Loader2 className="animate-spin" />
                      Đang tải...
                    </>
                  ) : (
                    "Tải ảnh nền"
                  )}
                </Button>
                {coverUrl ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => setCoverUrl(null)}
                  >
                    Xoá ảnh nền
                  </Button>
                ) : null}
              </div>
              <p className="text-xs text-muted-foreground">
                Ảnh ngang, hiển thị làm bìa cửa hàng trên trang public. Khuyến nghị tỷ lệ 3:1.
              </p>
              <input
                ref={coverRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleCover}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="display-name">Tên hiển thị</Label>
              <Input
                id="display-name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Tên của bạn"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="bio">Giới thiệu</Label>
              <Textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Vài dòng giới thiệu về bạn..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Template</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-3 text-sm text-muted-foreground">
              Chọn giao diện giống các nền tảng mạng xã hội phổ biến.
            </p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {BIO_TEMPLATE_KEYS.map((key) => {
                const selected = template === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setTemplate(key)}
                    className={cn(
                      "relative flex flex-col gap-2 rounded-xl border p-2.5 text-left transition-colors",
                      selected
                        ? "border-primary ring-2 ring-primary/20"
                        : "border-border bg-card/40 hover:border-foreground/25",
                    )}
                  >
                    <span className="block h-[4.5rem] w-full overflow-hidden rounded-lg border border-border/80 bg-muted/50">
                      <TemplateThumb template={key} />
                    </span>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {TEMPLATE_LABELS[key]?.platform}
                    </span>
                    <span className="text-xs font-semibold leading-tight">
                      {TEMPLATE_LABELS[key]?.name ?? key}
                    </span>
                    <span className="text-[11px] leading-snug text-muted-foreground">
                      {TEMPLATE_LABELS[key]?.desc}
                    </span>
                    {selected ? (
                      <span className="absolute bottom-2.5 right-2.5 flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                        <Check className="size-3" strokeWidth={3} />
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {message ? (
          <Alert variant={message.type === "error" ? "destructive" : "default"}>
            <AlertDescription>{message.text}</AlertDescription>
          </Alert>
        ) : null}

        <div className="flex justify-end">
          <Button type="submit" disabled={pending || uploading || uploadingCover}>
            {pending ? "Đang lưu..." : "Lưu thay đổi"}
          </Button>
        </div>
      </div>

      <div className="lg:sticky lg:top-2 lg:self-start">
        <p className="mb-1 text-xs font-medium text-muted-foreground">Xem trước</p>
        <p className="mb-2 text-[11px] text-muted-foreground/80">
          {TEMPLATE_LABELS[resolveBioTemplate(template)]?.name}
        </p>
        <AppearancePreview
          username={profile.username}
          displayName={displayName}
          bio={bio}
          avatarUrl={avatarUrl}
          coverUrl={coverUrl}
          template={template}
          initial={initial}
        />
      </div>
    </form>
  );
}
