# AGENT 7 — Design System / UI

> Dự án **Bio** (link-in-bio). Code vào `D:\Bio\Bio`. Học UI & convention từ `D:\Bio\CODE` (CHỈ ĐỌC).

---

## VAI TRÒ
Cổng UI shadcn (trên `@base-ui/react`) học từ `CODE`, theme, component tái sử dụng cho cả public & dashboard.

## CONTEXT BẮT BUỘC ĐỌC TRONG `CODE`
Toàn bộ `src/components/ui/*`, `src/app/globals.css`, `src/components/{app-shell,app-sidebar,page-header,submit-button}.tsx`. Đặc biệt `button.tsx` + `button-variants.ts` để nắm cách build trên `@base-ui/react`.

## NHIỆM VỤ CHI TIẾT
1. `components.json` shadcn + khởi tạo primitive: `button(+variants)`, `card`, `input`, `textarea`, `label`, `field`, `dialog`, `sheet`, `dropdown-menu`, `select`, `badge`, `alert`, `avatar`, `skeleton`, `tooltip`, `separator`, `scroll-area`, `sidebar`, `table`, `switch`, `tabs`. Build trên `@base-ui/react` y như `CODE`.
2. Token theme oklch trong `globals.css` (light/dark) + brand accent tím; định nghĩa **theme preset** cho public bio (3-5 preset: default, dark, gradient, minimal, neon) qua data-attribute/class để Agent 4 & 6 dùng.
3. Component public dùng chung trong `components/bio/`: `ProfileHeader`, `LinkButton`, `ProductCard`, `PinnedRail` — đẹp, mobile-first, tap target lớn (≥44px), KHÔNG phụ thuộc JS nặng (ưu tiên render được như RSC, chỉ phần click là client).
4. `app-shell.tsx` + `app-sidebar.tsx` cho dashboard (copy pattern `CODE`, đổi menu Bio: Tổng quan/Links/Sản phẩm/Thống kê/Giao diện/Cài đặt).
5. `submit-button.tsx` (pending qua `useFormStatus`), `page-header.tsx`.
6. Accessibility: focus-visible, contrast, aria; dark mode hoạt động.

## DEFINITION OF DONE
Mọi component import & render đúng light/dark; Agent 4 & 6 dùng lại không cần sửa primitive; theme preset chuyển được; `LinkButton`/`ProductCard` nhẹ JS.

## PHỤ THUỘC
Cần Agent 1 (scaffold + globals.css base). Bàn giao primitive cho Agent 3, 4, 6.

---

## HỢP ĐỒNG CHUNG (bắt buộc)

### Convention `CODE`
shadcn build trên `@base-ui/react` (KHÔNG Radix trừ `react-slot`); `cn()` từ `lib/utils`; `class-variance-authority` cho variants; theme token oklch `@theme inline` + `.dark`; font Roboto/Roboto_Mono; UI tiếng Việt.

### Component public cho Agent 4
`components/bio/`: `ProfileHeader` (avatar `next/image` priority + name + bio), `PinnedRail` (≤3 product ghim, badge "Nổi bật"), `LinkButton` (icon `lucide-react` theo `platform`, full-width), `ProductCard`. Phần click là client (gọi tracking), còn lại render tĩnh.

### Theme preset
Định nghĩa key preset khớp `profiles.theme` (default/dark/gradient/minimal/neon) để áp qua class/data-attribute trên container public.

### Data model (field UI cần)
- profiles: display_name, bio, avatar_url, theme.
- links: title, platform (chọn icon), url.
- products: title, description, image_url, price_cents/currency, url, is_pinned, pinned_position.

### KPI
Component public phải nhẹ — tránh thư viện nặng, ưu tiên SVG/CSS; tổng JS trang public < 30KB gz.
