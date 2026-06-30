# Bio — Link-in-Bio Platform · Bộ Prompt cho các Agent chuyên biệt

> **Mục tiêu sản phẩm:** Một nền tảng "link-in-bio" (kiểu Linktree/Beacons) cho phép người dùng tạo một trang bio công khai (`bio.app/@username`), gắn link tới các trang mạng xã hội, quản lý **sản phẩm** và **ghim tối đa 3 sản phẩm lên top**, đồng thời **thống kê lượt click + lượt ghé thăm** theo thời gian thực.
>
> **Ưu tiên số 1: TỐC ĐỘ CỰC NHANH.** Trang public phải đạt Lighthouse Performance ≥ 98, LCP < 1.2s (4G), TTFB < 200ms qua CDN, JS payload trang public < 30KB gzip.
>
> **Stack bắt buộc:** Next.js 16 (App Router, React 19 + React Compiler), TypeScript, Supabase (Postgres + Auth + RLS), Tailwind CSS v4, shadcn UI (trên `@base-ui/react`), TanStack Query.
>
> **Thư mục code:** Toàn bộ source đặt trong `D:\Bio\Bio`. Dự án tham chiếu để học convention & UI là `D:\Bio\CODE` (KHÔNG sửa `CODE`, chỉ đọc & học).

---

## 0. Cách dùng tài liệu này

Tài liệu chia công việc thành **9 agent chuyên biệt**. Mỗi agent có: vai trò, context bắt buộc đọc, nhiệm vụ chi tiết, file output, tiêu chí hoàn thành (Definition of Done), và điểm bàn giao.

**Thứ tự chạy (dependency):**

```
Agent 1 (Scaffold)
   └─> Agent 2 (Database)  ──┐
   └─> Agent 7 (Design Sys) ─┤
                             ├─> Agent 3 (Auth) ─> Agent 6 (Dashboard CRUD)
                             ├─> Agent 4 (Public Bio Page)
                             └─> Agent 5 (Analytics) ─┘
Agent 8 (Performance & QA) chạy cuối, xuyên suốt
Agent 0 (Orchestrator) giám sát toàn bộ
```

Khi giao việc cho một agent trong Cursor, **paste nguyên khối prompt của agent đó** + dán kèm mục **"HỢP ĐỒNG CHUNG"** (Section A) để mọi agent dùng chung một data contract.

---

## A. HỢP ĐỒNG CHUNG (mọi agent PHẢI tuân thủ)

### A.1 Convention học từ `D:\Bio\CODE`

Trước khi code, đọc các file sau trong `CODE` và **bắt chước y hệt style**:

- `src/lib/supabase/server.ts` — server client dùng `cache()` của React (1 client / request).
- `src/lib/supabase/client.ts` — browser client.
- `src/lib/supabase/middleware.ts` + `src/middleware.ts` — refresh session, chỉ match route cần auth để tối ưu TTFB.
- `src/lib/utils.ts` — helper `cn()`.
- `src/components/ui/button.tsx`, `button-variants.ts`, `card.tsx`, `input.tsx`, `dialog.tsx`, `sheet.tsx`, `sidebar.tsx` — pattern shadcn trên `@base-ui/react`.
- `src/app/globals.css` — theme token bằng `oklch`, `@theme inline`, dark mode `.dark`.
- `src/app/layout.tsx` — font `Roboto`/`Roboto_Mono` qua `next/font`, metadata SEO tiếng Việt.
- `src/app/(app)/deals/actions.ts` — Server Action `"use server"`, dùng discriminated-union state cho `useActionState`, `revalidatePath`.
- `src/components/query-provider.tsx` — cấu hình TanStack Query.

**Quy tắc bất di bất dịch:**
- Ngôn ngữ UI mặc định: **tiếng Việt** (`<html lang="vi">`).
- Path alias `@/*` -> `src/*`.
- Component UI shadcn build trên `@base-ui/react`, KHÔNG dùng Radix (trừ `@radix-ui/react-slot` nếu cần).
- Theme bằng `oklch` token, accent màu tím (violet) như `CODE`.
- KHÔNG thêm comment thừa kiểu "// import X". Comment chỉ giải thích lý do/trade-off.
- Server Action trả về discriminated union, không throw cho lỗi nghiệp vụ.

### A.2 Data Contract (Supabase) — đây là SOURCE OF TRUTH chung

Tất cả bảng nằm schema `public`. ID dùng `uuid` (`gen_random_uuid()`), timestamp `timestamptz default now()`.

```
profiles
  id            uuid PK  (= auth.users.id, on delete cascade)
  username      citext UNIQUE NOT NULL      -- dùng cho /@username
  display_name  text
  bio           text
  avatar_url    text
  theme         text default 'default'      -- key theme preset
  is_published  boolean default true
  created_at    timestamptz default now()
  updated_at    timestamptz default now()

links                         -- link MXH / link bio
  id          uuid PK
  profile_id  uuid FK -> profiles(id) on delete cascade
  title       text NOT NULL
  url         text NOT NULL                 -- đã validate http/https
  platform    text                          -- 'instagram'|'tiktok'|'youtube'|'facebook'|'x'|'website'|...
  position    integer NOT NULL default 0    -- thứ tự hiển thị
  is_active   boolean default true
  created_at  timestamptz default now()

products
  id              uuid PK
  profile_id      uuid FK -> profiles(id) on delete cascade
  title           text NOT NULL
  description     text
  image_url       text
  price_cents     integer                   -- nullable, đơn vị VND/cents tùy currency
  currency        text default 'VND'
  url             text                       -- link mua / affiliate (validate http/https)
  position        integer NOT NULL default 0
  is_pinned       boolean default false
  pinned_position smallint                   -- 1..3 khi is_pinned=true, NULL khi false
  is_active       boolean default true
  created_at      timestamptz default now()

-- ANALYTICS: ghi sự kiện thô + rollup ngày để đọc nhanh
events                         -- append-only, fire-and-forget
  id          bigint PK (identity)
  profile_id  uuid FK -> profiles(id) on delete cascade
  type        text NOT NULL                 -- 'page_view' | 'click'
  target_type text                          -- 'link' | 'product' | NULL (page_view)
  target_id   uuid                          -- links.id / products.id
  referrer    text
  country     text                          -- ISO-2 (từ header CDN)
  device      text                          -- 'mobile'|'desktop'|'tablet'
  created_at  timestamptz default now()

stats_daily                    -- rollup cho dashboard (đọc cực nhanh)
  profile_id  uuid
  day         date
  views       integer default 0
  clicks      integer default 0
  PRIMARY KEY (profile_id, day)
```

**RPC bắt buộc (Postgres functions):**
- `get_public_profile(p_username citext)` → trả về JSON gồm profile + links active (sort position) + products active (pinned 1..3 trước, rồi position). **SECURITY DEFINER**, chỉ trả dữ liệu public, dùng cho trang public 1 round-trip.
- `track_event(p_profile_id uuid, p_type text, p_target_type text, p_target_id uuid, p_referrer text, p_country text, p_device text)` → insert vào `events` + upsert `stats_daily`. **SECURITY DEFINER**, không cần auth.
- `set_pinned_products(p_product_ids uuid[])` → atomically gán pinned_position 1..3 cho user hiện tại (kiểm tra ownership), bỏ ghim phần còn lại. Tối đa 3.
- `reorder_links(p_ids uuid[])` / `reorder_products(p_ids uuid[])` → cập nhật position theo thứ tự mảng.

**Ràng buộc & index (do Agent 2 thực thi):**
- Partial unique index: `(profile_id, pinned_position) WHERE is_pinned` để 3 vị trí ghim không trùng.
- CHECK `pinned_position BETWEEN 1 AND 3`.
- Index `links(profile_id, position)`, `products(profile_id, is_pinned, position)`.
- Index `events(profile_id, created_at)`, `stats_daily(profile_id, day)`.
- RLS bật trên mọi bảng. `events` cho phép INSERT qua RPC (definer), chặn SELECT trực tiếp từ anon.

### A.3 Routes (App Router)

```
/                         landing (marketing, tĩnh, edge cache)
/login                    đăng nhập
/signup                   đăng ký + chọn username
/dashboard                tổng quan analytics + quick edit
/dashboard/links          quản lý links (CRUD + reorder)
/dashboard/products       quản lý sản phẩm (CRUD + ghim top 3 + reorder)
/dashboard/analytics      biểu đồ views/clicks theo ngày, top links/products
/dashboard/appearance     chọn theme, avatar, display_name, bio
/dashboard/settings       username, publish toggle, account
/[username]  hoặc  /@[username]   TRANG PUBLIC BIO (siêu nhanh)
/api/track                route handler nhận event (POST, edge runtime)
/auth/callback            supabase auth callback
```
> Quyết định: dùng `/@[username]` (segment `(@username)`) để tránh đụng route reserved. Public route KHÔNG đi qua middleware auth (giống `CODE`).

### A.4 Cấu trúc thư mục đích trong `D:\Bio\Bio`

```
Bio/
  src/
    app/
      (marketing)/page.tsx          # landing
      (auth)/login/...  (auth)/signup/...
      (dashboard)/
        layout.tsx                  # app-shell + sidebar
        dashboard/page.tsx
        dashboard/links/...
        dashboard/products/...
        dashboard/analytics/...
        dashboard/appearance/...
        dashboard/settings/...
      [username]/page.tsx           # public bio (hoặc (@username))
      api/track/route.ts            # edge tracking endpoint
      auth/callback/route.ts
      layout.tsx  globals.css  not-found.tsx
    components/
      ui/                           # shadcn (copy pattern từ CODE)
      bio/                          # block hiển thị public (LinkButton, ProductCard, PinnedRail, ProfileHeader)
      dashboard/                    # form, editor, charts
      app-shell.tsx  app-sidebar.tsx
    lib/
      supabase/{server,client,middleware,admin}.ts
      analytics/{track-client.ts, device.ts}
      validation/{url.ts, username.ts}
      types.ts                      # type sinh từ data contract
      query-keys.ts  utils.ts
    middleware.ts
  supabase/
    migrations/*.sql                # schema + RLS + RPC
    seed.sql
  .env.local.example
  package.json  tsconfig.json  next.config.ts  postcss.config.mjs  components.json
```

### A.5 Định nghĩa "NHANH" (KPI Agent 8 nghiệm thu)
- Public page: Lighthouse Perf ≥ 98 mobile; LCP < 1.2s; CLS < 0.02; TBT < 100ms.
- TTFB public < 200ms (ISR + CDN). Data 1 round-trip qua RPC `get_public_profile`.
- JS trang public < 30KB gz (ưu tiên RSC, hạn chế client component; tracking dùng `sendBeacon`).
- Không layout shift do ảnh: dùng `next/image` với width/height, `priority` cho avatar.

---

## Agent 0 — Orchestrator / Tech Lead

**Vai trò:** Điều phối, giữ tính nhất quán, review hợp đồng chung, không tự viết feature code.

**Context đọc:** Toàn bộ tài liệu này; `D:\Bio\CODE` để nắm convention.

**Nhiệm vụ:**
1. Khởi tạo `Bio/README.md` mô tả kiến trúc, KPI, cách chạy.
2. Tạo file `Bio/CONTRACT.md` = copy Section A để các agent tham chiếu; mọi thay đổi schema phải cập nhật ở đây trước.
3. Lập checklist bàn giao giữa các agent (ai phụ thuộc output nào).
4. Sau khi các agent xong: chạy `pnpm build` + `pnpm lint`, tổng hợp lỗi, phân lại cho agent phụ trách.
5. Đảm bảo KHÔNG agent nào sửa thư mục `CODE`.

**Definition of Done:** `README.md`, `CONTRACT.md` tồn tại; build pass; có bảng trạng thái các agent.

---

## Agent 1 — Scaffold & Config Agent

**Vai trò:** Dựng khung dự án Next.js 16 tối ưu tốc độ, chuẩn convention `CODE`.

**Context bắt buộc đọc trong `CODE`:** `package.json`, `tsconfig.json`, `next.config.*`, `postcss.config.mjs`, `components.json` (nếu có), `src/app/layout.tsx`, `src/app/globals.css`, `src/components/query-provider.tsx`.

**Nhiệm vụ chi tiết:**
1. Khởi tạo project trong `D:\Bio\Bio` (App Router, TS, Tailwind v4, alias `@/*`). Dùng **pnpm**.
2. Dependencies khớp `CODE` (versions tương đương hoặc mới hơn ổn định): `next@16`, `react@19`, `react-dom@19`, `@supabase/ssr`, `@supabase/supabase-js`, `@tanstack/react-query`, `@base-ui/react`, `@radix-ui/react-slot`, `class-variance-authority`, `clsx`, `tailwind-merge`, `lucide-react`, `tw-animate-css`, `shadcn`. Dev: `tailwindcss@4`, `@tailwindcss/postcss`, `babel-plugin-react-compiler`, `eslint`, `eslint-config-next`, types.
3. Bật **React Compiler** (`babel-plugin-react-compiler`) như `CODE`.
4. `next.config.ts`: bật `images` remotePatterns cho Supabase Storage + domain ảnh sản phẩm; cấu hình headers cache cho route public; bật `experimental` hợp lý cho tốc độ.
5. `globals.css`: copy hệ token oklch + dark mode + font variable từ `CODE`, đổi accent theo brand Bio (vẫn tím violet).
6. `layout.tsx`: font `Roboto`/`Roboto_Mono` qua `next/font`, `<html lang="vi">`, `TooltipProvider`, metadata SEO tiếng Việt cho "Bio - trang link cá nhân".
7. Tạo `lib/utils.ts` (`cn`), `lib/query-keys.ts`, `components/query-provider.tsx`.
8. Tạo `.env.local.example` với `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SITE_URL`.
9. Cấu hình ESLint + script `dev/build/start/lint`.

**Output:** Toàn bộ file config + `package.json` cài đặt xong (`pnpm install` chạy được), `pnpm dev` lên được trang trắng/landing tạm.

**Definition of Done:** `pnpm build` pass với app rỗng; theme + font hoạt động; alias `@/*` resolve.

---

## Agent 2 — Database & Supabase Agent

**Vai trò:** Thiết kế schema, RLS, RPC, index, migration, seed.

**Context đọc:** Section A.2; `CODE/src/lib/supabase/*` để biết cách app gọi RPC.

**Nhiệm vụ chi tiết:**
1. Viết migration SQL trong `Bio/supabase/migrations/` (đánh số `0001_init.sql`, `0002_rls.sql`, `0003_rpc.sql`, `0004_indexes.sql`).
2. Tạo các bảng theo **A.2** chính xác từng cột/kiểu/ràng buộc. Bật extension `citext`, `pgcrypto`.
3. Trigger `updated_at` tự cập nhật trên `profiles`.
4. Trigger sau khi `auth.users` được tạo → tạo `profiles` row (handle_new_user) **nhưng** username sẽ set ở bước signup (cho phép null tạm rồi enforce, hoặc tạo profile ở server action signup — chọn 1 và ghi rõ trong CONTRACT).
5. **RLS policies:**
   - `profiles`: chủ sở hữu (`auth.uid() = id`) full CRUD; anon SELECT chỉ khi `is_published`.
   - `links`/`products`: chủ sở hữu full CRUD (qua `profile_id = auth.uid()`); anon KHÔNG select trực tiếp (trang public đọc qua RPC definer).
   - `events`: anon/auth KHÔNG select/insert trực tiếp; chỉ ghi qua RPC `track_event` (SECURITY DEFINER).
   - `stats_daily`: chủ sở hữu SELECT.
6. **RPC functions** đúng spec A.2: `get_public_profile`, `track_event`, `set_pinned_products`, `reorder_links`, `reorder_products`. Mỗi function: validate input, kiểm tra ownership (trừ public/track), `SECURITY DEFINER` + `SET search_path = public`.
7. `get_public_profile` trả 1 JSON: `{ profile, links: [...], pinned: [...3], products: [...] }` đã sort sẵn để client khỏi xử lý.
8. Index theo A.2. Cân nhắc index phục vụ `get_public_profile` (lookup theo username).
9. `seed.sql`: 1 user demo + vài link + 5 product (3 ghim) + vài event để dev thấy số liệu.
10. Sinh TypeScript types vào `src/lib/types.ts` (khớp schema; có thể dùng `supabase gen types` rồi tinh chỉnh).
11. Viết `Bio/supabase/README.md` hướng dẫn chạy migration (CLI hoặc dán SQL).

**Tối ưu tốc độ:** `get_public_profile` phải dùng index, tránh N+1; trả JSON build sẵn; `track_event` không block (client gọi fire-and-forget).

**Definition of Done:** Chạy migration sạch trên Supabase mới; RLS test: anon không đọc được `links`/`events` trực tiếp nhưng `get_public_profile` trả đủ dữ liệu published; `set_pinned_products` enforce tối đa 3 và unique vị trí.

---

## Agent 3 — Auth & Account Agent

**Vai trò:** Đăng ký/đăng nhập, chọn username, middleware session, bảo vệ `/dashboard`.

**Context đọc:** `CODE/src/app/login/login-form.tsx`, `CODE/src/lib/supabase/{server,client,middleware}.ts`, `CODE/src/middleware.ts`, `CODE/src/app/auth/callback/route.ts`.

**Nhiệm vụ chi tiết:**
1. Tạo `src/lib/supabase/{server,client,middleware}.ts` copy pattern `CODE` (cached server client, browser client, updateSession).
2. `src/middleware.ts`: chỉ match `/dashboard/:path*`, `/login`, `/signup` — **public bio & /api/track KHÔNG đi qua middleware** (giữ TTFB thấp). Redirect chưa auth → `/login`; đã auth vào `/login` → `/dashboard`.
3. `/signup`: form email + password + **username** (real-time check khả dụng qua RPC/`select`), validate username (a-z0-9_, 3-30 ký tự, không trùng) bằng `lib/validation/username.ts`. Server Action tạo user + tạo/đổi `profiles.username`.
4. `/login`: email + password (`signInWithPassword`), giống `CODE` nhưng bỏ allowlist (cho phép self-serve signup). Có link sang `/signup`.
5. `/auth/callback/route.ts` xử lý exchange code (nếu dùng magic link/oauth sau này — tối thiểu hỗ trợ session).
6. `signOut` action; helper `getCurrentProfile()` (server) trả profile của user hiện tại (dùng cached client).
7. UI dùng `Card`, `Input`, `Label`, `Button`, `Alert` của design system.

**Definition of Done:** Đăng ký tạo được profile + username unique; đăng nhập vào `/dashboard`; truy cập `/dashboard` khi chưa login bị đẩy về `/login`; username trùng bị chặn với thông báo tiếng Việt.

---

## Agent 4 — Public Bio Page Agent (TRỌNG TÂM TỐC ĐỘ)

**Vai trò:** Xây trang public `/@[username]` siêu nhanh, đẹp, là bộ mặt sản phẩm.

**Context đọc:** `CODE/src/app/p/[token]/page.tsx` + `portal-client.tsx` (pattern public page), `CODE/src/app/layout.tsx`, design system của Agent 7, RPC `get_public_profile` của Agent 2.

**Nhiệm vụ chi tiết:**
1. Route `app/[username]/page.tsx` (hoặc nhóm `(public)`), **chủ yếu RSC**, không bọc QueryProvider, không sidebar.
2. Lấy dữ liệu **1 round-trip** bằng RPC `get_public_profile(username)`. Nếu không tồn tại / `is_published=false` → `notFound()`.
3. **Caching cho tốc độ:**
   - Dùng ISR: `export const revalidate = 60` (hoặc dùng `unstable_cache`/tag theo username) + on-demand revalidation khi user sửa (Agent 6 gọi `revalidateTag(`profile:${username}`)`).
   - Set headers cache CDN phù hợp.
4. `generateMetadata`: title/description/OG theo profile (avatar làm OG image), `lang="vi"`.
5. **Bố cục hiển thị** (component trong `components/bio/`):
   - `ProfileHeader`: avatar (`next/image`, `priority`, width/height cố định), display_name, bio.
   - `PinnedRail`: tối đa **3 sản phẩm ghim** nổi bật trên cùng (card lớn, badge "Nổi bật").
   - `LinkList`: danh sách `LinkButton` (icon theo `platform` từ `lucide-react`), full-width, tap target ≥ 44px.
   - `ProductGrid`: các sản phẩm còn lại.
   - Footer "Tạo bio của bạn" → CTA về landing.
6. **Tracking (fire-and-forget, không chặn render):**
   - Một client component mỏng `BioTracker` gửi `page_view` qua `navigator.sendBeacon('/api/track', ...)` khi mount (1 lần).
   - `LinkButton`/`ProductCard` khi click: gọi `sendBeacon` event `click` với `target_type` + `target_id` **rồi mới** điều hướng (dùng `keepalive`/sendBeacon để không mất event). Tuyệt đối không await trước khi mở link.
   - Thu `referrer`, `device` (từ `lib/analytics/device.ts`), `country` server đọc từ header CDN khi nhận ở `/api/track`.
7. Responsive mobile-first, theme từ `profiles.theme`. Tránh CLS (đặt kích thước cố định cho ảnh/skeleton).
8. JS client tối thiểu — chỉ `BioTracker` + handler click; phần còn lại RSC.

**Definition of Done:** Trang render đẹp với seed data; Lighthouse mobile Perf ≥ 98, LCP < 1.2s, CLS < 0.02; page_view & click ghi vào `events`/`stats_daily`; username không tồn tại → trang 404 đẹp.

---

## Agent 5 — Analytics & Tracking Agent

**Vai trò:** Đường ống thu thập sự kiện + tổng hợp + biểu đồ dashboard.

**Context đọc:** RPC `track_event`, bảng `events`/`stats_daily` (A.2); `BioTracker` của Agent 4.

**Nhiệm vụ chi tiết:**
1. `app/api/track/route.ts` — **edge runtime** (`export const runtime = 'edge'`), method POST:
   - Parse body (hỗ trợ `sendBeacon` gửi `text/plain` JSON).
   - Đọc `country` từ header CDN (vd `x-vercel-ip-country`), `referrer`, `user-agent` → suy ra `device`.
   - Gọi RPC `track_event` qua Supabase (anon key, vì RPC là definer). Trả `204` ngay, không chờ ghi xong nếu có thể (nhưng đảm bảo request hoàn tất).
   - Rate-limit nhẹ chống spam (theo IP + profile, in-memory/Upstash optional).
2. `lib/analytics/track-client.ts`: helper `trackPageView(profileId)` và `trackClick(profileId, targetType, targetId)` dùng `navigator.sendBeacon` (fallback `fetch` `keepalive:true`).
3. `lib/analytics/device.ts`: parse UA → `mobile|tablet|desktop` (nhẹ, không thư viện nặng).
4. **Aggregation đọc nhanh:** dashboard đọc `stats_daily` cho biểu đồ theo ngày (7/30/90 ngày); top links/products tính bằng query group trên `events` (có index) hoặc bảng rollup riêng nếu cần.
5. Server functions/queries cho dashboard: `getOverviewStats(profileId, range)`, `getDailySeries`, `getTopLinks`, `getTopProducts`.
6. Component biểu đồ trong `components/dashboard/charts/` (line chart views/clicks, bảng top). Dùng thư viện chart nhẹ hoặc SVG tự vẽ (tránh bundle nặng). Chart là client component, chỉ ở `/dashboard/analytics`.
7. (Tùy chọn) Cron/Edge function gộp `events` cũ để giữ bảng gọn.

**Definition of Done:** Click & view từ trang public xuất hiện trong dashboard trong ~vài giây; biểu đồ 7/30 ngày đúng số liệu seed; endpoint `/api/track` trả 204, chịu được gọi liên tục, không làm chậm điều hướng link.

---

## Agent 6 — Dashboard & CRUD Agent

**Vai trò:** Quản lý links, sản phẩm (CRUD), ghim top 3, sắp xếp kéo-thả, appearance, settings.

**Context đọc:** `CODE/src/app/(app)/layout.tsx`, `app-shell.tsx`, `app-sidebar.tsx`, `CODE/src/app/(app)/deals/_components/*` (pattern table/form/dialog/sheet), `CODE/src/app/(app)/deals/actions.ts` (Server Action + `useActionState` + `revalidatePath`), TanStack Query provider.

**Nhiệm vụ chi tiết:**
1. `(dashboard)/layout.tsx`: dựng `AppShell` + `AppSidebar` (copy pattern `CODE`), menu: Tổng quan, Links, Sản phẩm, Thống kê, Giao diện, Cài đặt. Hiển thị link "Xem bio của tôi" → `/@username`.
2. **`/dashboard/links`:**
   - Danh sách link, form thêm/sửa (title, url, platform, active). Validate URL qua `lib/validation/url.ts` (chỉ http/https, chuẩn hóa).
   - Kéo-thả sắp xếp → gọi `reorder_links`. Toggle active. Xóa có confirm.
   - Server Actions trả discriminated union; UI optimistic update bằng TanStack Query, sau đó `revalidateTag(profile:username)` để public page cập nhật.
3. **`/dashboard/products`:**
   - CRUD product (title, description, image upload lên Supabase Storage, price/currency, url).
   - **Ghim top 3:** UI chọn tối đa 3 sản phẩm ghim + sắp thứ tự 1-2-3 → gọi `set_pinned_products`. Chặn chọn quá 3 với thông báo rõ ràng. Hiển thị badge vị trí ghim.
   - Kéo-thả sắp xếp phần không ghim → `reorder_products`.
4. **`/dashboard/appearance`:** đổi `display_name`, `bio`, upload `avatar_url` (Supabase Storage), chọn `theme` preset (preview live).
5. **`/dashboard/settings`:** đổi `username` (check unique, cảnh báo đổi link công khai), toggle `is_published`, đăng xuất, xóa tài khoản.
6. **`/dashboard` (tổng quan):** thẻ số liệu (views, clicks hôm nay/7 ngày từ Agent 5), nút nhanh thêm link/sản phẩm, preview bio.
7. Mọi mutation phải `revalidateTag`/`revalidatePath` để trang public ISR cập nhật tức thì.
8. Upload ảnh: tạo bucket `public` (avatars, products) trong Supabase Storage; nén/resize client trước upload để nhẹ.

**Definition of Done:** CRUD link & product hoạt động; ghim đúng tối đa 3 và thứ tự phản ánh ở public page; kéo-thả lưu position; đổi appearance/username cập nhật public page sau revalidate; ảnh upload hiển thị qua `next/image`.

---

## Agent 7 — Design System / UI Agent

**Vai trò:** Cổng UI shadcn (trên `@base-ui/react`) học từ `CODE`, theme, component tái sử dụng cho cả public & dashboard.

**Context đọc:** Toàn bộ `CODE/src/components/ui/*`, `CODE/src/app/globals.css`, `CODE/src/components/{app-shell,app-sidebar,page-header,submit-button}.tsx`.

**Nhiệm vụ chi tiết:**
1. Thiết lập `components.json` shadcn + copy/khởi tạo các primitive: `button(+variants)`, `card`, `input`, `textarea`, `label`, `field`, `dialog`, `sheet`, `dropdown-menu`, `select`, `badge`, `alert`, `avatar`, `skeleton`, `tooltip`, `separator`, `scroll-area`, `sidebar`, `table`, `switch`, `tabs`. Pattern build trên `@base-ui/react` y như `CODE` (xem `button.tsx`).
2. Token theme oklch trong `globals.css` (light/dark) + brand accent tím; định nghĩa **theme preset** cho public bio (vd 3-5 preset: default, dark, gradient, minimal, neon) qua data-attribute/class để Agent 4 & 6 dùng.
3. Component dùng chung public: `components/bio/{ProfileHeader,LinkButton,ProductCard,PinnedRail}.tsx` (style đẹp, mobile-first, tap target lớn, không phụ thuộc JS nặng).
4. `app-shell.tsx` + `app-sidebar.tsx` cho dashboard (copy pattern `CODE`, đổi menu Bio).
5. `submit-button.tsx` (pending state qua `useFormStatus`), `page-header.tsx`.
6. Đảm bảo accessibility: focus-visible, contrast, aria.

**Definition of Done:** Storybook-free nhưng mọi component import được, render đúng light/dark; Agent 4 & 6 dùng lại không cần sửa primitive; theme preset chuyển được.

---

## Agent 8 — Performance & QA Agent

**Vai trò:** Bảo chứng KPI tốc độ (A.5), kiểm thử, dọn bundle, SEO.

**Context đọc:** Section A.5, output của tất cả agent.

**Nhiệm vụ chi tiết:**
1. Đo Lighthouse (mobile) trang public; ép Perf ≥ 98. Tìm & loại client component thừa, dynamic import phần nặng (chart), tree-shake icon.
2. Kiểm tra JS payload public < 30KB gz (`next build` + phân tích). Đảm bảo trang public không kéo TanStack Query/dialog/sidebar.
3. Xác minh caching: ISR + `revalidateTag` hoạt động (sửa dashboard → public đổi sau revalidate, không phải chờ TTL).
4. Kiểm tra tracking không chặn điều hướng (đo thời gian click→navigate), event không mất khi rời trang (sendBeacon/keepalive).
5. Kiểm RLS: anon không đọc `links/products/events` trực tiếp; `get_public_profile` chỉ trả published.
6. SEO: metadata, OG image, sitemap (`/sitemap.ts` liệt kê profile published), `robots.ts`.
7. Test cơ bản: validate URL/username, `set_pinned_products` ≤ 3, reorder. Viết vài test (Vitest/Playwright tối thiểu cho luồng chính) nếu thời gian cho phép.
8. `next/image` tối ưu (sizes, formats avif/webp), font `display:swap`, preconnect Supabase.
9. Lập báo cáo `Bio/PERF_REPORT.md` ghi số đo trước/sau + việc đã làm.

**Definition of Done:** Tất cả KPI A.5 đạt; `pnpm build`/`lint` sạch; có `sitemap.ts`/`robots.ts`; báo cáo perf hoàn tất.

---

## B. Lưu ý vận hành khi chạy các Agent trong Cursor

- Mỗi agent: dán **prompt của agent** + **Section A (Hợp đồng chung)**. Yêu cầu agent đọc các file `CODE` được liệt kê TRƯỚC khi viết code.
- Không agent nào được sửa thư mục `D:\Bio\CODE`.
- Khi agent đổi schema/route/type → cập nhật `Bio/CONTRACT.md` rồi báo Agent 0 để đồng bộ các agent phụ thuộc.
- Chạy tuần tự theo sơ đồ dependency ở Section 0; Agent 7 nên xong trước Agent 4 & 6.
- Sau mỗi agent: chạy `pnpm lint && pnpm build`, sửa lỗi trước khi bàn giao.
```
