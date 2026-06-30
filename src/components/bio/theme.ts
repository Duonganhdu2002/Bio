/**
 * Theme preset CHÍNH THỨC cho trang public bio (Agent 7 sở hữu).
 * Khóa khớp `profiles.theme` (CONTRACT §A.2): default | dark | gradient | minimal | neon.
 *
 * `getBioTheme(key)` trả về tên class áp lên container `<main>` của trang public.
 * Mỗi class (định nghĩa trong `globals.css`) gán đè token oklch + nền cho cả
 * subtree, nên mọi component bio (bg-card/text-foreground/bg-primary…) tự đổi
 * giao diện mà không cần sửa. Agent 4 & 6 dùng lại không phải đổi gì.
 */

export const BIO_THEME_KEYS = [
  "default",
  "dark",
  "gradient",
  "minimal",
  "neon",
] as const;

export type BioThemeKey = (typeof BIO_THEME_KEYS)[number];

export const DEFAULT_BIO_THEME: BioThemeKey = "default";

export function getBioTheme(key: string | null | undefined): string {
  const resolved = (BIO_THEME_KEYS as readonly string[]).includes(key ?? "")
    ? (key as BioThemeKey)
    : DEFAULT_BIO_THEME;
  return `bio-theme-${resolved}`;
}

/**
 * PHONG CÁCH (layout/shape) cho trang public bio — trục độc lập với chủ đề màu.
 * Khóa khớp `profiles.layout`. Mỗi class `bio-style-<key>` (định nghĩa trong
 * `globals.css`) chỉ đổi hình khối/bố cục (bo góc, viền, đổ bóng, canh lề, font)
 * mà KHÔNG đụng tới token màu của theme → màu và phong cách phối hợp tự do.
 */
export const BIO_STYLE_KEYS = [
  "classic",
  "pill",
  "square",
  "outline",
  "bold",
  "editorial",
] as const;

export type BioStyleKey = (typeof BIO_STYLE_KEYS)[number];

export const DEFAULT_BIO_STYLE: BioStyleKey = "classic";

export function getBioStyle(key: string | null | undefined): string {
  const resolved = (BIO_STYLE_KEYS as readonly string[]).includes(key ?? "")
    ? (key as BioStyleKey)
    : DEFAULT_BIO_STYLE;
  return `bio-style-${resolved}`;
}

/**
 * TEMPLATE (bố cục UI/UX) cho trang public bio — trục độc lập với chủ đề màu
 * và phong cách. Mỗi template là MỘT cách dựng trang khác hẳn (sắp xếp khối,
 * độ rộng, vị trí avatar/links/sản phẩm), render bởi `<BioTemplate>`.
 * Khóa khớp `profiles.template`:
 * stack | spotlight | grid | sidebar | showcase | magazine.
 */
export const BIO_TEMPLATE_KEYS = [
  "stack",
  "spotlight",
  "grid",
  "sidebar",
  "showcase",
  "magazine",
] as const;

export type BioTemplateKey = (typeof BIO_TEMPLATE_KEYS)[number];

export const DEFAULT_BIO_TEMPLATE: BioTemplateKey = "stack";

/** Nhãn template theo giao diện nền tảng MXH (dashboard Giao diện). */
export const BIO_TEMPLATE_META: Record<
  BioTemplateKey,
  { name: string; desc: string; platform: string }
> = {
  stack: {
    platform: "Linktree",
    name: "Linktree",
    desc: "Cột link cổ điển, căn giữa",
  },
  spotlight: {
    platform: "X",
    name: "X (Twitter)",
    desc: "Ảnh bìa lớn, avatar nổi",
  },
  grid: {
    platform: "Pinterest",
    name: "Pinterest",
    desc: "Liên kết dạng lưới 2 cột",
  },
  sidebar: {
    platform: "LinkedIn",
    name: "LinkedIn",
    desc: "Hồ sơ cố định bên trái",
  },
  showcase: {
    platform: "Instagram",
    name: "Instagram",
    desc: "Shop tab, sản phẩm & banner",
  },
  magazine: {
    platform: "Threads",
    name: "Threads",
    desc: "Tối giản, căn trái",
  },
};

export function resolveBioTemplate(key: string | null | undefined): BioTemplateKey {
  return (BIO_TEMPLATE_KEYS as readonly string[]).includes(key ?? "")
    ? (key as BioTemplateKey)
    : DEFAULT_BIO_TEMPLATE;
}
