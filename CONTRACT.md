# Bio — HỢP ĐỒNG CHUNG (CONTRACT)

> **SOURCE OF TRUTH** cho mọi agent. Trước khi đổi schema / route / type, **cập nhật file này TRƯỚC**, rồi báo Agent 0 để đồng bộ các agent phụ thuộc.
>
> Code đặt trong `D:\Bio\Bio`. Học convention & UI từ `D:\Bio\CODE` (**CHỈ ĐỌC, KHÔNG sửa**).

---

## A.1 Convention học từ `D:\Bio\CODE`

Đọc các file sau trong `CODE` và **bắt chước y hệt style**:

- `src/lib/supabase/server.ts` — server client dùng `cache()` của React (1 client / request).
- `src/lib/supabase/client.ts` — browser client.
- `src/lib/supabase/middleware.ts` + `src/middleware.ts` — refresh session, chỉ match route cần auth để tối ưu TTFB.
- `src/lib/utils.ts` — helper `cn()`.
- `src/components/ui/{button,button-variants,card,input,dialog,sheet,sidebar}.tsx` — pattern shadcn trên `@base-ui/react`.
- `src/app/globals.css` — theme token bằng `oklch`, `@theme inline`, dark mode `.dark`.
- `src/app/layout.tsx` — font `Roboto`/`Roboto_Mono` qua `next/font`, metadata SEO tiếng Việt.
- `src/app/(app)/deals/actions.ts` — Server Action `"use server"`, discriminated-union state cho `useActionState`, `revalidatePath`.
- `src/components/query-provider.tsx` — cấu hình TanStack Query.

**Quy tắc bất di bất dịch:**

- Ngôn ngữ UI mặc định: **tiếng Việt** (`<html lang="vi">`).
- Path alias `@/*` → `src/*`.
- Component UI shadcn build trên `@base-ui/react`, KHÔNG dùng Radix (trừ `@radix-ui/react-slot` nếu cần).
- Theme bằng `oklch` token, accent màu tím (violet).
- KHÔNG thêm comment thừa kiểu `// import X`. Comment chỉ giải thích lý do / trade-off.
- Server Action trả về discriminated union, **không throw** cho lỗi nghiệp vụ.

### Stack bắt buộc

Next.js 16 (App Router, React 19 + React Compiler), TypeScript, Supabase (Postgres + Auth + RLS), Tailwind CSS v4, shadcn UI (trên `@base-ui/react`), TanStack Query. Dùng **pnpm**.

---

## A.2 Data Contract (Supabase) — SOURCE OF TRUTH

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
  price_cents     integer                   -- nullable, đơn vị theo currency
  currency        text default 'VND'
  url             text                       -- link mua / affiliate (validate http/https)
  position        integer NOT NULL default 0
  is_pinned       boolean default false
  pinned_position smallint                   -- 1..3 khi is_pinned=true, NULL khi false
  is_active       boolean default true
  created_at      timestamptz default now()

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

### RPC bắt buộc (Postgres functions)

- `get_public_profile(p_username citext)` → JSON `{ profile, links[], pinned[≤3], products[] }` đã sort sẵn (pinned 1..3 trước, rồi position). **SECURITY DEFINER**, chỉ trả dữ liệu published, dùng cho trang public **1 round-trip**.
- `track_event(p_profile_id uuid, p_type text, p_target_type text, p_target_id uuid, p_referrer text, p_country text, p_device text)` → insert `events` + upsert `stats_daily`. **SECURITY DEFINER**, không cần auth.
- `set_pinned_products(p_product_ids uuid[])` → atomically gán pinned_position 1..3 cho user hiện tại (kiểm ownership), bỏ ghim phần còn lại. Tối đa 3.
- `reorder_links(p_ids uuid[])` / `reorder_products(p_ids uuid[])` → cập nhật position theo thứ tự mảng.
- `get_top_links(p_days int default 30, p_limit int default 5)` / `get_top_products(...)` → top link/sản phẩm theo lượt `click` của **user hiện tại** (`auth.uid()`) trong N ngày, trả `(id uuid, title text, clicks bigint)` sort giảm dần. **SECURITY DEFINER** (đọc `events` vốn bị RLS chặn SELECT); `revoke` khỏi `public, anon`, chỉ `authenticated`. *(Agent 5 — migration `0006_analytics_rpc.sql`)*

> Mỗi RPC: validate input, kiểm ownership (trừ public/track), `SECURITY DEFINER` + `SET search_path = public`.

### Ràng buộc & index (Agent 2 thực thi)

- Partial unique index `(profile_id, pinned_position) WHERE is_pinned` — 3 vị trí ghim không trùng.
- CHECK `pinned_position BETWEEN 1 AND 3`.
- Index `links(profile_id, position)`, `products(profile_id, is_pinned, position)`.
- Index `events(profile_id, created_at)`, `stats_daily(profile_id, day)`.
- RLS bật trên **mọi bảng**. `events` chỉ INSERT qua RPC (definer), chặn SELECT trực tiếp từ anon.

### Quyết định cần ghi rõ (cập nhật khi Agent 2 chốt)

- **Tạo profile cho user mới:** [ ] trigger `handle_new_user` (username null tạm) — hoặc — [x] **tạo profile trong server action signup**. → *Agent 2 chốt: tạo ở server action signup (Agent 3).* Lý do: `profiles.username` là `NOT NULL` và do user tự chọn lúc đăng ký; tạo ở signup giữ ràng buộc sạch, tránh username placeholder.
  - **Cách insert (chốt bởi Agent 0):** signup dùng **service-role admin client** để check username + insert profile, **KHÔNG** dùng session-insert. Lý do: robust cho cả khi bật email-confirm (lúc đó chưa có session → session-insert bất khả thi). Race condition chống bằng `UNIQUE(username)` (bắt `23505`).
  - Policy `profiles_insert_self` (`id = auth.uid()`) **vẫn giữ**, dùng cho owner tự insert/khôi phục profile ở dashboard/settings sau này (Agent 6), không phải cho luồng signup.
  - ✅ **Đã xử lý (Agent 0, 2026-06-18):** nếu `auth.signUp` thành công nhưng insert profile lỗi (kể cả `23505`) → signup action **rollback** bằng `admin.auth.admin.deleteUser(user.id)` để không để lại user mồ côi (tránh email bị "chiếm" không đăng ký lại được); người dùng thử lại sạch. Dashboard layout vẫn phòng thủ: profile null → redirect `/login`.
- **events** (Agent 2): RLS bật nhưng **không có policy** → chặn select/insert trực tiếp từ anon/auth; chỉ ghi qua `track_event` (SECURITY DEFINER). `stats_daily`: chủ sở hữu chỉ SELECT.
- **Ràng buộc thêm** (Agent 2): CHECK `products` đảm bảo `pinned_position` NOT NULL khi `is_pinned=true` và NULL khi `false` (đồng bộ với partial unique index).
- **Migration files** (Agent 2): `supabase/migrations/{0001_init,0002_rls,0003_rpc,0004_indexes}.sql` + `supabase/seed.sql`. Types: `src/lib/types.ts`. Hướng dẫn: `supabase/README.md`.
- **`src/lib/types.ts` (owner: Agent 2):** ✅ **Chốt (Agent 0, 2026-06-18): giữ type viết tay**, KHÔNG `supabase gen types`. Đã đối chiếu lại **khớp 100%** với `0001_init.sql` (mọi cột + nullability). Lý do: generate cho shape lồng `Database['public']['Tables'][...]['Row']` buộc mọi agent sửa import; các interface phẳng `Profile/Link/Product/AnalyticsEvent/StatsDaily` là source nhẹ, ổn định đang dùng trực tiếp. Header file đã ghi rõ quy tắc: đổi schema → cập nhật migration TRƯỚC rồi đồng bộ thủ công file này.

---

## A.3 Routes (App Router)

```
/                         landing (marketing, tĩnh, edge cache)
/login                    đăng nhập
/signup                   đăng ký + chọn username
/dashboard                tổng quan analytics + quick edit
/dashboard/links          quản lý links (CRUD + reorder)
/dashboard/products       quản lý sản phẩm (CRUD + ghim top 3 + reorder)
/dashboard/analytics      biểu đồ views/clicks theo ngày, top links/products
/dashboard/appearance     theme, avatar, display_name, bio
/dashboard/settings       username, publish toggle, account
/@[username]              TRANG PUBLIC BIO (siêu nhanh, KHÔNG qua middleware)
/api/track                route handler nhận event (POST, edge runtime)
/auth/callback            supabase auth callback
```

> Quyết định: dùng `/@[username]` để tránh đụng route reserved. Public route **KHÔNG** đi qua middleware auth (giữ TTFB thấp, giống `CODE`).

---

## A.4 Cấu trúc thư mục đích trong `D:\Bio\Bio`

```
Bio/
  src/
    app/
      (marketing)/page.tsx          # landing
      (auth)/login/...  (auth)/signup/...
      (dashboard)/
        layout.tsx                  # app-shell + sidebar
        dashboard/page.tsx
        dashboard/{links,products,analytics,appearance,settings}/...
      [username]/page.tsx           # public bio (/@username)
      api/track/route.ts            # edge tracking endpoint
      auth/callback/route.ts
      layout.tsx  globals.css  not-found.tsx
    components/
      ui/                           # shadcn (copy pattern từ CODE)
      bio/                          # LinkButton, ProductCard, PinnedRail, ProfileHeader
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

---

## A.5 Định nghĩa "NHANH" (KPI — Agent 8 nghiệm thu)

- Public page: Lighthouse Perf **≥ 98** mobile; **LCP < 1.2s**; **CLS < 0.02**; **TBT < 100ms**.
- **TTFB public < 200ms** (ISR + CDN). Data **1 round-trip** qua RPC `get_public_profile`.
- **JS trang public < 30KB gz** (ưu tiên RSC, hạn chế client component; tracking dùng `sendBeacon`).
- Không layout shift do ảnh: `next/image` với width/height cố định, `priority` cho avatar.

---

## Lịch sử thay đổi contract

| Ngày | Agent | Thay đổi |
|---|---|---|
| 2026-06-18 | 0 | Khởi tạo contract từ Section A (AGENT_PROMPTS.md). |
| 2026-06-18 | 2 | Triển khai DB: migrations 0001-0004 + seed; chốt tạo profile ở signup server action; events không policy (ghi qua RPC); thêm CHECK đồng bộ pinned_position; types `src/lib/types.ts`. |
| 2026-06-18 | 2 | Đã apply thử + verify trên project Supabase `Bio` (ref `dprusybvaemmxorlidyx`): 4 migration + seed chạy sạch, `get_public_profile`/`track_event` đúng. Siết bảo mật: `set_updated_at` thêm `search_path`; `revoke execute ... from public, anon` cho `set_pinned_products`/`reorder_links`/`reorder_products` (đã fold vào 0001/0003). |
| 2026-06-18 | 3 | Auth & account: supabase clients `{server,client,middleware,admin}` + `src/middleware.ts` (chỉ match `/dashboard`, `/login`, `/signup`); `/signup` (server action tạo profile + username, check khả dụng real-time qua `GET /api/auth/username`), `/login` (bỏ allowlist), `/auth/callback`; helper `getCurrentProfile()` + action `signOut`; `lib/validation/username.ts`. Bổ sung UI primitives Card/Input/Label/Button/Alert (đồng bộ Agent 7). |
| 2026-06-18 | 5 | **Analytics & tracking:** `/api/track` (edge, `after()` → RPC `track_event`, suy `country`/`device`, rate-limit IP+profile); `lib/analytics/{device,track-client,range,queries}.ts` (sendBeacon, series/overview đọc `stats_daily`, top đọc qua RPC); thêm RPC `get_top_links`/`get_top_products` (SECURITY DEFINER, owner-scoped) — migration `0006_analytics_rpc.sql` (đã apply + verify trên project `dprusybvaemmxorlidyx`); chart SVG tự vẽ `components/dashboard/charts/*` (dynamic import, không vào bundle public) + trang `/dashboard/analytics`. ⚠️ `components/bio/tracked-anchor.tsx` (Agent 4) gửi body **snake_case** (`profile_id/target_type/target_id`) trong khi contract dùng camelCase → `/api/track` đã nới để chấp nhận **cả hai** kiểu key (không mất click). Đề xuất Agent 0/4 thống nhất 1 kiểu sau. |
| 2026-06-18 | 8 | **QA/Perf pass:** thêm `robots.ts` + `sitemap.ts` (route `/robots.txt`, `/sitemap.xml`; sitemap liệt kê profile published qua anon RLS). Xác minh RLS trực tiếp (anon chặn `links/products/events/stats_daily`; `get_public_profile` published-only). Sửa regression chặn build: tách `lib/analytics/range.ts` client-safe (range-tabs không còn kéo `supabase/server` vào client). Sửa bug mất click event (`tracked-anchor` snake_case ↔ endpoint camelCase) → dùng chung `trackClick`. Xóa `components/bio/platform.tsx` mồ côi. `next.config` bật AVIF/WebP; `layout` preconnect Supabase. **MỞ (Agent 6):** `products-manager.tsx` import `formatPrice` không tồn tại trong `lib/format.ts` → build đỏ. KPI Lighthouse/byte bundle **chưa đo** (chờ Agent 4/6/7 đông cứng + tắt dev). Chi tiết: `Bio/PERF_REPORT.md`. |
| 2026-06-18 | 7 | **Design system:** bổ sung primitives shadcn trên `@base-ui/react` (`textarea, field, badge, avatar, skeleton, separator, scroll-area, table, dialog, sheet, dropdown-menu, select, sidebar` + mới `switch, tabs`); hook `use-mobile` (dùng `useSyncExternalStore`). **Theme preset chính thức** (default/dark/gradient/minimal/neon) định nghĩa trong `globals.css` qua class `.bio-theme-<key>`; `components/bio/theme.ts#getBioTheme(key)` trả `bio-theme-<key>` (giữ API cũ Agent 4 dùng), `lib/themes.ts` swatch khớp 5 key cho /appearance. Bio leaf components (`ProfileHeader/LinkButton/ProductCard/PinnedRail`) giữ API hiện tại của Agent 4 (`profile`/`link`/`product`/`pinned`+`profileId`), dùng `trackClick` (`lib/analytics/track-client`) + `PlatformIcon` (`bio/platform.tsx`, mở rộng) + `formatPrice` (`bio/price.ts`). `app-shell`/`app-sidebar` nhận `profile` (menu Bio: Tổng quan/Links/Sản phẩm/Thống kê/Giao diện/Cài đặt, đăng xuất qua server action). Khôi phục `lib/format.ts` (`SUPPORTED_CURRENCIES/fromPriceCents/toPriceCents/formatPrice`). ⚠️ **Blocker cho Agent 6 (Next 16):** `revalidateTag(tag)` nay cần 2 đối số `revalidateTag(tag, profile)` — lỗi TS2554 ở `appearance/links/products/settings/actions.ts`; Agent 6 cần thêm đối số thứ 2 (vd `"max"`). Ngoài phạm vi Agent 7. |
| 2026-06-18 | 0 | **Rà soát note Agent 3:** (1) `src/lib/types.ts` khớp 100% schema `0001_init.sql` → giữ tạm, giao Agent 2 xác nhận/regenerate. (2) Chốt signup insert profile qua **service-role admin** (robust khi bật email-confirm); `profiles_insert_self` giữ cho owner-insert ở dashboard. Ghi thêm follow-up xử lý auth user mồ côi. Env (`NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`) khớp `admin.ts` ↔ `.env.local.example`. |
| 2026-06-18 | 0 | **Dọn nợ & nghiệm thu build (thay Agent 2/3/4/8):** (1) **Chốt tracking camelCase** — gỡ nhánh nhận snake_case trong `/api/track` (mọi client qua `track-client.ts` đã camelCase; `tracked-anchor.tsx` tạm của Agent 4 đã bị Agent 7 thay bằng `link-button`/`product-card`/`bio-tracker`). (2) **Self-heal profile mồ côi** — signup rollback `deleteUser` khi insert profile lỗi (kể cả 23505). (3) **Chốt `lib/types.ts` viết tay** (khớp 100% `0001_init.sql`). (4) **`pnpm lint` + `pnpm build` PASS** — sửa 3 lỗi `react-hooks/set-state-in-effect` (link/product form dialog + settings dùng mẫu điều chỉnh state lúc render) và bỏ qua tham số `_`-prefix trong `eslint.config.mjs`. |
| 2026-06-18 | 4 | **Trang public `/@username`:** route `app/[username]/page.tsx` (RSC, param có tiền tố `@`, sai/không published → `notFound()`); data 1 round-trip qua `get_public_profile`; ISR `revalidate=60` + `unstable_cache` tag `profile:<username>` (Agent 6 gọi `revalidateTag('profile:'+username)` khi user sửa). Thêm `lib/supabase/public.ts` (anon, KHÔNG cookie → giữ được ISR). `generateMetadata` (title/description/OG avatar). Bộ component `components/bio/*` (ProfileHeader/PinnedRail/LinkList+LinkButton/ProductGrid+ProductCard/BioTracker/FooterCta/PlatformIcon/theme/price) + `BioTracker` page_view và click qua `track-client` (sendBeacon). **Phối hợp:** dùng API tracking của Agent 5 (`trackPageView`/`trackClick`, device suy ở edge route). **Lưu ý Agent 7:** `components/bio/*` + `theme.ts` là bản tạm của Agent 4 — Agent 7 tinh chỉnh UI/preset. **Lưu ý chung:** lucide v1.x đã bỏ icon thương hiệu (Instagram/Youtube/Facebook/Twitter) → tạm dùng icon trung tính trong `PlatformIcon`. |
| 2026-06-18 | 6 | **Dashboard & CRUD:** route group `app/(dashboard)/` (layout `getCurrentProfile()` → `QueryProvider` + `AppShell`), trang `/dashboard` (thẻ số liệu đọc `stats_daily` 7 ngày + quick actions + preview), `/dashboard/links` (CRUD + toggle active + xoá confirm + kéo-thả `reorder_links`), `/dashboard/products` (CRUD + upload ảnh + **ghim ≤3 có thứ tự** `set_pinned_products` + kéo-thả `reorder_products`), `/dashboard/appearance` (display_name/bio/avatar + chọn theme **dùng đúng `BIO_THEME_KEYS` + `getBioTheme` của Agent 7**, preview live áp class `bio-theme-*`), `/dashboard/settings` (đổi username check unique + cảnh báo đổi link + revalidate cả tag cũ/mới, toggle `is_published`, đăng xuất, xoá tài khoản qua admin `deleteUser` cascade). Mọi mutation: Server Action trả **discriminated union** (`lib/dashboard/action-result.ts`) + optimistic update TanStack Query, sau đó `revalidateTag('profile:'+username, "max")`. Helper mới: `lib/validation/url.ts` (chỉ http/https, chuẩn hoá), `lib/storage/upload.ts` (nén canvas→webp, upload Storage theo thư mục `<uid>/`), `hooks/use-sortable-list.ts` (kéo-thả HTML5 gốc, **không thêm dependency**), `components/dashboard/{page-header,confirm-dialog}.tsx`. **Migration mới `0005_storage.sql`** (bucket `avatars`+`products` public-read, owner ghi theo `(storage.foldername(name))[1] = auth.uid()`) — ⚠️ **cần Agent 2/0 apply** lên project Supabase trước khi upload hoạt động. Sửa blocker Agent 7 (`revalidateTag` 2 đối số → `"max"`) và bug Agent 8 (`formatPrice` import từ `components/bio/price`). Đã xoá `lib/themes.ts` (Agent 7) vì /appearance dùng trực tiếp `bio-theme-*` cho preview chuẩn xác. `pnpm` lint + tsc PASS. |
