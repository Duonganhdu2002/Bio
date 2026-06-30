# AGENT 0 — Orchestrator / Tech Lead

> Dự án **Bio** (link-in-bio kiểu Linktree). Code vào `D:\Bio\Bio`. Học convention & UI từ `D:\Bio\CODE` (CHỈ ĐỌC, không sửa).

---

## VAI TRÒ
Điều phối các agent, giữ tính nhất quán, review hợp đồng chung. KHÔNG tự viết feature code.

## NHIỆM VỤ CHI TIẾT
1. Tạo `Bio/README.md`: mô tả kiến trúc, KPI tốc độ, cách chạy (`pnpm install`, `pnpm dev`, migrate Supabase).
2. Tạo `Bio/CONTRACT.md` = copy nguyên "HỢP ĐỒNG CHUNG" bên dưới; mọi thay đổi schema/route/type phải cập nhật ở đây TRƯỚC.
3. Lập checklist bàn giao giữa các agent (ai phụ thuộc output nào) theo sơ đồ dependency.
4. Sau khi các agent xong: chạy `pnpm build` + `pnpm lint`, tổng hợp lỗi, phân lại cho agent phụ trách.
5. Đảm bảo KHÔNG agent nào sửa thư mục `CODE`.

## DEFINITION OF DONE
`README.md` + `CONTRACT.md` tồn tại; `pnpm build` pass; có bảng trạng thái các agent.

---

## HỢP ĐỒNG CHUNG (data contract + convention — bắt buộc)

### Convention học từ `D:\Bio\CODE` (đọc trước khi code)
- `src/lib/supabase/server.ts` — server client dùng `cache()` (1 client/request).
- `src/lib/supabase/client.ts` — browser client.
- `src/lib/supabase/middleware.ts` + `src/middleware.ts` — refresh session, chỉ match route cần auth.
- `src/lib/utils.ts` — `cn()`.
- `src/components/ui/{button,button-variants,card,input,dialog,sheet,sidebar}.tsx` — shadcn trên `@base-ui/react`.
- `src/app/globals.css` — theme oklch, `@theme inline`, dark mode `.dark`.
- `src/app/layout.tsx` — font Roboto/Roboto_Mono qua `next/font`, metadata SEO tiếng Việt.
- `src/app/(app)/deals/actions.ts` — Server Action `"use server"` + discriminated-union state + `revalidatePath`.
- `src/components/query-provider.tsx` — TanStack Query.

Quy tắc: UI tiếng Việt (`<html lang="vi">`); alias `@/*`→`src/*`; shadcn trên `@base-ui/react` (không Radix trừ `react-slot`); theme oklch accent tím; không comment thừa; Server Action trả union, không throw cho lỗi nghiệp vụ.

### Stack
Next.js 16 (App Router, React 19 + React Compiler), TypeScript, Supabase (Postgres + Auth + RLS), Tailwind v4, shadcn (`@base-ui/react`), TanStack Query. Dùng **pnpm**.

### Data model (schema `public`, uuid + timestamptz)
- **profiles**(id uuid PK = auth.users.id, username citext UNIQUE, display_name, bio, avatar_url, theme default 'default', is_published bool default true, created_at, updated_at).
- **links**(id uuid PK, profile_id FK→profiles cascade, title, url, platform, position int default 0, is_active bool default true, created_at).
- **products**(id uuid PK, profile_id FK→profiles cascade, title, description, image_url, price_cents int, currency default 'VND', url, position int default 0, is_pinned bool default false, pinned_position smallint CHECK 1..3, is_active bool default true, created_at).
- **events**(id bigint identity PK, profile_id FK cascade, type 'page_view'|'click', target_type 'link'|'product'|null, target_id uuid, referrer, country, device, created_at) — append-only.
- **stats_daily**(profile_id, day date, views int, clicks int, PK(profile_id,day)) — rollup đọc nhanh.

### RPC bắt buộc
- `get_public_profile(p_username citext)` → JSON `{profile, links[], pinned[≤3], products[]}` đã sort sẵn (pinned 1..3 trước). SECURITY DEFINER, chỉ trả published.
- `track_event(...)` → insert `events` + upsert `stats_daily`. SECURITY DEFINER, không cần auth.
- `set_pinned_products(p_product_ids uuid[])` → gán pinned_position 1..3 cho user hiện tại, tối đa 3, kiểm ownership.
- `reorder_links(p_ids uuid[])` / `reorder_products(p_ids uuid[])`.

### Ràng buộc & index
Partial unique `(profile_id, pinned_position) WHERE is_pinned`; CHECK pinned_position 1..3; index `links(profile_id,position)`, `products(profile_id,is_pinned,position)`, `events(profile_id,created_at)`, `stats_daily(profile_id,day)`. RLS bật mọi bảng; `events` chỉ ghi qua RPC definer, chặn SELECT anon.

### Routes
`/` landing · `/login` · `/signup` · `/dashboard` · `/dashboard/{links,products,analytics,appearance,settings}` · `/@[username]` (public, KHÔNG qua middleware) · `/api/track` (edge POST) · `/auth/callback`.

### KPI tốc độ (Definition of "nhanh")
Public page Lighthouse mobile Perf ≥ 98; LCP < 1.2s; CLS < 0.02; TBT < 100ms; TTFB < 200ms (ISR + CDN); data 1 round-trip qua `get_public_profile`; JS public < 30KB gz (ưu tiên RSC; tracking dùng `sendBeacon`); ảnh `next/image` width/height cố định, avatar `priority`.

### Cấu trúc thư mục đích `D:\Bio\Bio`
`src/app/{(marketing),(auth),(dashboard),[username],api/track,auth/callback,layout.tsx,globals.css}` · `src/components/{ui,bio,dashboard,app-shell.tsx,app-sidebar.tsx}` · `src/lib/{supabase,analytics,validation,types.ts,query-keys.ts,utils.ts}` · `src/middleware.ts` · `supabase/{migrations,seed.sql}` · các file config.
