export const LINK_PLATFORMS = [
  { value: "instagram", label: "Instagram" },
  { value: "tiktok", label: "TikTok" },
  { value: "facebook", label: "Facebook" },
  { value: "youtube", label: "YouTube" },
  { value: "shopee", label: "Shopee" },
  { value: "zalo", label: "Zalo" },
  { value: "x", label: "X" },
  { value: "telegram", label: "Telegram" },
  { value: "website", label: "Website" },
  { value: "other", label: "Khác" },
] as const;

export type LinkPlatform = (typeof LINK_PLATFORMS)[number]["value"];

export function getPlatformLabel(platform: string | null | undefined): string {
  const found = LINK_PLATFORMS.find((p) => p.value === platform);
  return found?.label ?? (platform?.trim() || "Link");
}

/** Đoán nền tảng từ URL khi người dùng dán link. */
export function detectPlatformFromUrl(url: string): LinkPlatform {
  const lower = url.trim().toLowerCase();
  if (!lower) return "website";
  if (lower.includes("instagram.com") || lower.includes("instagr.am")) return "instagram";
  if (lower.includes("tiktok.com")) return "tiktok";
  if (lower.includes("facebook.com") || lower.includes("fb.com") || lower.includes("fb.me"))
    return "facebook";
  if (lower.includes("youtube.com") || lower.includes("youtu.be")) return "youtube";
  if (lower.includes("shopee.")) return "shopee";
  if (lower.includes("zalo.me") || lower.includes("zalo.vn")) return "zalo";
  if (lower.includes("twitter.com") || lower.includes("x.com")) return "x";
  if (lower.includes("t.me") || lower.includes("telegram.")) return "telegram";
  return "website";
}
