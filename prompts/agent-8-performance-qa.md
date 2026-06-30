# AGENT 8 — Performance & QA

> Dự án **Bio** (link-in-bio). Code vào `D:\Bio\Bio`. Học convention từ `D:\Bio\CODE` (CHỈ ĐỌC).

---

## VAI TRÒ
Bảo chứng KPI tốc độ, kiểm thử, dọn bundle, SEO. Chạy cuối / xuyên suốt.

## CONTEXT ĐỌC
KPI tốc độ (mục dưới) + output của tất cả agent. `CODE/src/app/layout.tsx` (font/metadata), `CODE/next.config.*`.

## NHIỆM VỤ CHI TIẾT
1. Đo Lighthouse (mobile) trang public; ép Perf ≥ 98. Loại client component thừa, `dynamic import` phần nặng (chart), tree-shake icon.
2. Kiểm JS payload public < 30KB gz (`next build` + phân tích). Đảm bảo public KHÔNG kéo TanStack Query/dialog/sidebar/chart.
3. Xác minh caching: ISR + `revalidateTag` (sửa dashboard → public đổi sau revalidate, không chờ TTL).
4. Kiểm tracking không chặn điều hướng (đo click→navigate); event không mất khi rời trang (sendBeacon/keepalive).
5. Kiểm RLS: anon KHÔNG đọc `links/products/events` trực tiếp; `get_public_profile` chỉ trả published.
6. SEO: metadata, OG image, `sitemap.ts` (liệt kê profile published), `robots.ts`.
7. Test cơ bản: validate URL/username, `set_pinned_products` ≤3, reorder. Vài test Vitest/Playwright cho luồng chính nếu kịp.
8. `next/image` tối ưu (sizes, avif/webp), font `display:swap`, preconnect Supabase.
9. Báo cáo `Bio/PERF_REPORT.md`: số đo trước/sau + việc đã làm.

## DEFINITION OF DONE
Tất cả KPI đạt; `pnpm build`/`lint` sạch; có `sitemap.ts`/`robots.ts`; `PERF_REPORT.md` hoàn tất.

## PHỤ THUỘC
Sau khi Agent 1-7 xong. Báo lỗi/regression về Agent 0 để phân lại.

---

## HỢP ĐỒNG CHUNG (bắt buộc)

### KPI tốc độ (mục tiêu nghiệm thu)
- Public page Lighthouse mobile Perf ≥ 98; LCP < 1.2s; CLS < 0.02; TBT < 100ms.
- TTFB public < 200ms (ISR + CDN); data 1 round-trip qua `get_public_profile`.
- JS trang public < 30KB gz (ưu tiên RSC; tracking dùng `sendBeacon`).
- Không CLS do ảnh: `next/image` width/height; avatar `priority`.

### Kiến trúc cần xác minh
- Public `/@[username]`: RSC + ISR + tag `profile:<username>`, không middleware, không QueryProvider.
- `/api/track`: edge, trả 204, fire-and-forget.
- Dashboard: tách bundle, đọc `stats_daily` cho số liệu.
- RLS: `events` chỉ ghi qua RPC definer; `links/products` anon không select trực tiếp.

### Convention
Next.js 16 (React 19 + Compiler), Supabase, Tailwind v4, shadcn `@base-ui/react`, UI tiếng Việt. Không sửa `CODE`.
