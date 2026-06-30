# AGENT 1 — Scaffold & Config

> Dự án **Bio** (link-in-bio kiểu Linktree). Code vào `D:\Bio\Bio`. Học convention & UI từ `D:\Bio\CODE` (CHỈ ĐỌC, không sửa).

---

## VAI TRÒ
Dựng khung dự án Next.js 16 tối ưu tốc độ, chuẩn convention `CODE`.

## CONTEXT BẮT BUỘC ĐỌC TRONG `CODE`
`package.json`, `tsconfig.json`, `next.config.*`, `postcss.config.mjs`, `components.json` (nếu có), `src/app/layout.tsx`, `src/app/globals.css`, `src/components/query-provider.tsx`.

## NHIỆM VỤ CHI TIẾT
1. Khởi tạo project trong `D:\Bio\Bio` (App Router, TS, Tailwind v4, alias `@/*`). Dùng **pnpm**.
2. Dependencies khớp `CODE` (bản tương đương hoặc mới hơn ổn định): `next@16`, `react@19`, `react-dom@19`, `@supabase/ssr`, `@supabase/supabase-js`, `@tanstack/react-query`, `@base-ui/react`, `@radix-ui/react-slot`, `class-variance-authority`, `clsx`, `tailwind-merge`, `lucide-react`, `tw-animate-css`, `shadcn`. Dev: `tailwindcss@4`, `@tailwindcss/postcss`, `babel-plugin-react-compiler`, `eslint`, `eslint-config-next`, types.
3. Bật **React Compiler** (`babel-plugin-react-compiler`) như `CODE`.
4. `next.config.ts`: `images.remotePatterns` cho Supabase Storage + domain ảnh sản phẩm; headers cache cho route public; bật `experimental` hợp lý cho tốc độ.
5. `globals.css`: copy hệ token oklch + dark mode + font variable từ `CODE`, accent tím (violet) theo brand Bio.
6. `layout.tsx`: font `Roboto`/`Roboto_Mono` qua `next/font`, `<html lang="vi">`, `TooltipProvider`, metadata SEO tiếng Việt cho "Bio — trang link cá nhân".
7. Tạo `lib/utils.ts` (`cn`), `lib/query-keys.ts`, `components/query-provider.tsx`.
8. `.env.local.example`: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SITE_URL`.
9. ESLint + scripts `dev/build/start/lint`.

## DEFINITION OF DONE
`pnpm install` OK; `pnpm build` pass với app rỗng; theme + font hoạt động; alias `@/*` resolve; `pnpm dev` lên landing tạm.

## BÀN GIAO CHO
Agent 2 (db), Agent 3 (auth), Agent 7 (design system) build tiếp trên khung này.

---

## HỢP ĐỒNG CHUNG (data contract + convention — bắt buộc)

### Convention học từ `D:\Bio\CODE`
- `src/lib/supabase/server.ts` — server client dùng `cache()`; `client.ts` — browser client; `middleware.ts`+`src/middleware.ts` — refresh session chỉ match route cần auth.
- `src/lib/utils.ts` — `cn()`; `src/components/ui/*` — shadcn trên `@base-ui/react`; `src/app/globals.css` — theme oklch; `src/app/layout.tsx` — font + metadata; `src/app/(app)/deals/actions.ts` — Server Action union state.

Quy tắc: UI tiếng Việt; alias `@/*`; shadcn trên `@base-ui/react`; theme oklch accent tím; không comment thừa; Server Action trả union.

### Data model (schema `public`, uuid + timestamptz)
- **profiles**(id=auth.users.id, username citext UNIQUE, display_name, bio, avatar_url, theme, is_published bool, created_at, updated_at).
- **links**(id, profile_id FK cascade, title, url, platform, position int, is_active bool, created_at).
- **products**(id, profile_id FK cascade, title, description, image_url, price_cents, currency 'VND', url, position int, is_pinned bool, pinned_position smallint 1..3, is_active bool, created_at).
- **events**(id bigint, profile_id, type 'page_view'|'click', target_type, target_id, referrer, country, device, created_at).
- **stats_daily**(profile_id, day, views, clicks, PK(profile_id,day)).

### RPC: `get_public_profile`, `track_event`, `set_pinned_products`, `reorder_links`, `reorder_products` (định nghĩa do Agent 2 viết).

### Routes
`/` · `/login` · `/signup` · `/dashboard` + `/dashboard/{links,products,analytics,appearance,settings}` · `/@[username]` (public, KHÔNG qua middleware) · `/api/track` (edge) · `/auth/callback`.

### KPI tốc độ
Public Lighthouse ≥ 98 mobile, LCP < 1.2s, CLS < 0.02, TTFB < 200ms (ISR+CDN), JS public < 30KB gz, data 1 round-trip RPC.

### Cấu trúc thư mục đích
`src/app/{(marketing),(auth),(dashboard),[username],api/track,auth/callback}` · `src/components/{ui,bio,dashboard,app-shell.tsx,app-sidebar.tsx}` · `src/lib/{supabase,analytics,validation,types.ts,query-keys.ts,utils.ts}` · `supabase/{migrations,seed.sql}`.
