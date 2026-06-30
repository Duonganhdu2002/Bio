/**
 * Định dạng giá hiển thị cho bio components.
 *
 * Nguồn chuẩn (single source of truth) là `@/lib/format`. File này chỉ re-export
 * để giữ import quen thuộc `./price` của các leaf component (`product-card`, ...).
 */
export { formatPrice } from "@/lib/format";
