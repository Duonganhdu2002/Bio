# AGENT 6 — Dashboard & CRUD

> Dự án **Bio** (link-in-bio). Code vào `D:\Bio\Bio`. Học convention từ `D:\Bio\CODE` (CHỈ ĐỌC).

---

## VAI TRÒ
Quản lý links, sản phẩm (CRUD), **ghim top 3**, sắp xếp kéo-thả, appearance, settings.

## CONTEXT BẮT BUỘC ĐỌC TRONG `CODE`
`src/app/(app)/layout.tsx`, `src/components/app-shell.tsx`, `src/components/app-sidebar.tsx`, `src/app/(app)/deals/_components/*` (table/form/dialog/sheet), `src/app/(app)/deals/actions.ts` (Server Action + `useActionState` + `revalidatePath`), `src/components/query-provider.tsx`.

## NHIỆM VỤ CHI TIẾT
1. `(dashboard)/layout.tsx`: `AppShell` + `AppSidebar` (copy pattern `CODE`). Menu: Tổng quan, Links, Sản phẩm, Thống kê, Giao diện, Cài đặt. Có link "Xem bio của tôi" → `/@username`.
2. **`/dashboard/links`:** danh sách + form thêm/sửa (title, url, platform, active). Validate URL qua `lib/validation/url.ts` (chỉ http/https, chuẩn hóa). Kéo-thả → `reorder_links`. Toggle active. Xóa có confirm. Server Action trả union; optimistic update bằng TanStack Query; sau đó `revalidateTag('profile:'+username)`.
3. **`/dashboard/products`:** CRUD product (title, description, image upload Supabase Storage, price/currency, url). **Ghim top 3:** UI chọn tối đa 3 + sắp thứ tự 1-2-3 → `set_pinned_products`. Chặn chọn >3 với thông báo rõ. Badge vị trí ghim. Kéo-thả phần không ghim → `reorder_products`.
4. **`/dashboard/appearance`:** đổi `display_name`, `bio`, upload `avatar_url` (Storage), chọn `theme` preset (preview live).
5. **`/dashboard/settings`:** đổi `username` (check unique, cảnh báo đổi link công khai), toggle `is_published`, đăng xuất, xóa tài khoản.
6. **`/dashboard` (tổng quan):** thẻ số liệu (views/clicks hôm nay/7 ngày từ Agent 5), nút nhanh thêm link/sản phẩm, preview bio.
7. Mọi mutation `revalidateTag`/`revalidatePath` để public ISR cập nhật tức thì.
8. Upload ảnh: bucket Storage (avatars, products); nén/resize client trước upload cho nhẹ.

## DEFINITION OF DONE
CRUD link & product OK; ghim đúng ≤3 và thứ tự phản ánh ở public; kéo-thả lưu position; đổi appearance/username cập nhật public sau revalidate; ảnh hiển thị qua `next/image`.

## PHỤ THUỘC
Cần Agent 1, 2 (RPC + bảng + Storage), 3 (auth + getCurrentProfile), 5 (số liệu), 7 (UI). Phối hợp Agent 4 (revalidateTag).

---

## HỢP ĐỒNG CHUNG (bắt buộc)

### Convention `CODE`
App-shell + sidebar như `CODE/(app)`; Server Action `"use server"` trả discriminated union (xem `deals/actions.ts`), `revalidatePath`/`revalidateTag`; UI tiếng Việt; shadcn trên `@base-ui/react`; TanStack Query cho optimistic update; theme oklch tím.

### RPC dùng
`set_pinned_products(p_product_ids uuid[])` (≤3, kiểm ownership), `reorder_links(p_ids uuid[])`, `reorder_products(p_ids uuid[])`. Đọc trực tiếp `links`/`products` qua RLS owner; `stats_daily` cho thẻ số liệu.

### Data model (phần quản lý)
- **links**(id, profile_id, title, url, platform, position, is_active).
- **products**(id, profile_id, title, description, image_url, price_cents, currency 'VND', url, position, is_pinned, pinned_position smallint 1..3, is_active).
- **profiles**(username citext UNIQUE, display_name, bio, avatar_url, theme, is_published).

### Revalidation contract
Public page dùng tag `profile:<username>`. Mọi thay đổi link/product/appearance/username → gọi `revalidateTag('profile:'+username)` (đổi username phải revalidate cả tag cũ & mới).

### KPI
Dashboard tách bundle khỏi public; mutation phản hồi tức thì (optimistic), public cập nhật ngay sau revalidate (không chờ TTL).
