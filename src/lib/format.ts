/**
 * Tiện ích giá tiền cho dashboard sản phẩm (Agent 6).
 *
 * Quy ước lưu trữ: `products.price_cents` = giá hiển thị × 100 cho MỌI tiền tệ,
 * đồng bộ với `formatPrice` ở `components/bio/price.ts` (chia 100 khi hiển thị).
 * VND hiển thị 0 chữ số thập phân, các tiền tệ khác 2 chữ số.
 */

export const SUPPORTED_CURRENCIES = [
  "VND",
  "USD",
  "EUR",
  "GBP",
  "JPY",
  "AUD",
  "SGD",
  "THB",
] as const;

export type Currency = (typeof SUPPORTED_CURRENCIES)[number];

/** Giá nhập từ form (đơn vị tiền tệ) → `price_cents` lưu DB. */
export function toPriceCents(value: number, _currency: string): number {
  return Math.round(value * 100);
}

/** `price_cents` từ DB → giá hiển thị trên form (đơn vị tiền tệ). */
export function fromPriceCents(cents: number, _currency: string): number {
  return cents / 100;
}

/** Định dạng `price_cents` thành chuỗi tiền tệ hiển thị. Null khi không có giá. */
export function formatPrice(
  priceCents: number | null | undefined,
  currency: string,
): string | null {
  if (priceCents == null) return null;

  const amount = priceCents / 100;
  try {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: currency || "VND",
      maximumFractionDigits: currency === "VND" ? 0 : 2,
    }).format(amount);
  } catch {
    return `${amount.toLocaleString("vi-VN")} ${currency}`;
  }
}
