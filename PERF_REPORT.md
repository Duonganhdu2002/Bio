# Bio — PERF & QA REPORT (Agent 8)

> Ngày: 2026-06-18 · Người chạy: Agent 8 (Performance & QA)
> Phạm vi: nghiệm thu KPI tốc độ, RLS/bảo mật, SEO, kiểm thử. Code tại `D:\Bio\Bio`.

---

## 0. TÓM TẮT TRẠNG THÁI

| Hạng mục | Trạng thái |
|---|---|
| RLS / bảo mật DB (anon không đọc trực tiếp; RPC published-only) | ✅ Đã xác minh trực tiếp trên Supabase |
| Kiến trúc public page (RSC + ISR + tag, không middleware, không Query/dialog/chart) | ✅ Đã xác minh tĩnh |
| Tracking không chặn điều hướng (sendBeacon + keepalive) | ✅ Đã xác minh (+ sửa 1 bug payload) |
| SEO: metadata, OG, `robots.ts`, `sitemap.ts` | ✅ metadata sẵn có; đã thêm robots + sitemap |
| `next/image` AVIF/WebP, font `display:swap`, preconnect Supabase | ✅ Đã bổ sung/đã có |
| `pnpm lint` | ✅ Sạch |
| `pnpm build` xanh | ⛔ **BỊ CHẶN** — codebase đang được Agent 4/6/7 chỉnh sửa trực tiếp khi QA chạy (xem §5) |
| Lighthouse mobile Perf ≥ 98 / LCP / CLS / TBT | ⏳ **CHƯA ĐO** — cần build đông cứng + tắt dev server (xem §6) |
| JS public < 30KB gz (số đo byte) | ⏳ **CHƯA ĐO chính xác** — bằng chứng định tính rất tốt (xem §3) |

**Kết luận:** Phần thuộc về Agent 8 đã hoàn tất ở mức tối đa có thể với trạng thái hiện tại. Việc đo KPI cuối (Lighthouse + byte bundle) và build xanh **phụ thuộc Agent 4/6/7 hoàn tất** (DoD của tôi ghi rõ: chạy "sau khi Agent 1–7 xong"). Các regression chặn build đã được khoanh vùng và báo về Agent 0 (§5).

---

## 1. RLS & BẢO MẬT (đã xác minh trực tiếp trên project Supabase `dprusybvaemmxorlidyx`)

Chạy thật với role `anon`:

```sql
set local role anon;
select 'links', count(*) from public.links
union all select 'products', count(*) from public.products
union all select 'events', count(*) from public.events
union all select 'profiles', count(*) from public.profiles
union all select 'stats_daily', count(*) from public.stats_daily;
```

Kết quả:

| Bảng | Số dòng anon đọc được |
|---|---|
| links | **0** (chặn) |
| products | **0** (chặn) |
| events | **0** (chặn) |
| stats_daily | **0** (chặn) |
| profiles | 1 (chỉ profile `is_published` — đúng thiết kế) |

RPC `get_public_profile` (role anon):
- `get_public_profile('demo')` → trả về profile, **4 links**, **3 pinned** (đúng, đã sort).
- `get_public_profile('user_không_tồn_tại')` → `null`.
- Chỉ trả khi `is_published` (đảm bảo bởi `where p.is_published` trong hàm).

→ **Đạt KPI bảo mật:** anon KHÔNG select trực tiếp `links/products/events`; `events` ghi-only qua RPC SECURITY DEFINER; `get_public_profile` chỉ trả published.

### Advisors bảo mật (Supabase linter)

| Mức | Vấn đề | Đánh giá |
|---|---|---|
| INFO | `events` RLS bật, không policy | ✅ **Cố ý** — chỉ ghi qua `track_event` (definer), chặn mọi truy cập trực tiếp. |
| WARN | `get_public_profile` / `track_event` anon execute được | ✅ **Cố ý** — đây là RPC công khai (public bio + tracking). |
| WARN | `reorder_*` / `set_pinned_products` authenticated execute | ✅ **Cố ý** — đã `revoke from anon`; kiểm ownership bằng `auth.uid()` bên trong. |
| WARN | Extension `citext` nằm ở schema `public` | 🟡 Khuyến nghị Agent 2: chuyển sang schema riêng (vd `extensions`). Mức thấp. |
| WARN | Auth: leaked-password protection đang tắt | 🟡 Khuyến nghị bật trong Supabase Auth settings (HaveIBeenPwned). |

---

## 2. KIẾN TRÚC PUBLIC PAGE — đã xác minh tĩnh (đúng CONTRACT)

`src/app/[username]/page.tsx`:
- `export const revalidate = 60` → **ISR**.
- Dữ liệu **1 round-trip** qua `get_public_profile` bọc `unstable_cache(..., { tags: ['profile:<username>'] })` → Agent 6 gọi `revalidateTag('profile:<username>')` để cập nhật on-demand không chờ TTL.
- Dùng `createPublicClient()` (KHÔNG đọc cookie) → giữ route ISR-eligible, không bị ép dynamic. `cache()` dedupe `generateMetadata` + render.
- Header CDN cho `/@:username`: `public, s-maxage=60, stale-while-revalidate=86400` (`next.config.ts`).

`src/middleware.ts`:
- `matcher: ["/dashboard", "/dashboard/:path*", "/login", "/signup"]` → **public `/@username` KHÔNG qua middleware** (không chạy `getUser()`), giữ TTFB thấp. ✅

`src/app/api/track/route.ts`:
- `runtime = "edge"`, trả **204** ngay, ghi DB qua `after()` (fire-and-forget). Rate-limit nhẹ theo IP+profile. ✅

> Ghi chú: trong `next build`, route hiện là `ƒ (Dynamic)` vì không có `generateStaticParams` (username do người dùng tạo — không thể prerender lúc build). Đây là **ISR-on-demand**: render lần đầu rồi cache theo `revalidate`/tag + CDN `s-maxage`. Đúng thiết kế.

---

## 3. JS PAYLOAD TRANG PUBLIC (< 30KB gz) — bằng chứng định tính

Quét toàn bộ `src/components/bio/*` (cây import của public page):
- **KHÔNG** import: `@tanstack/react-query`, `query-provider`, `ui/dialog`, `ui/sheet`, `ui/sidebar`, `ui/dropdown-menu`, `ui/select`, chart/recharts. ✅
- Root `layout.tsx` chỉ bọc `TooltipProvider` (KHÔNG bọc `QueryProvider` toàn cục). ✅
- Chỉ **2 client component** mỏng trong layer bio:
  - `bio-tracker.tsx` — gửi `page_view` 1 lần khi mount.
  - `tracked-anchor.tsx` — gắn tracking click vào thẻ `<a>`.
- Mọi thành phần còn lại (ProfileHeader, LinkList, LinkButton, PinnedRail, ProductGrid, ProductCard, FooterCta) là **RSC** (0 JS client).
- `optimizePackageImports: ["lucide-react"]` + icon dùng lẻ → tree-shake tốt.

→ Khả năng đạt < 30KB gz **rất cao**. Cần số byte chính xác từ build đông cứng (xem §6).

---

## 4. TRACKING — kiểm "không mất event, không chặn điều hướng"

- `track-client.ts`: `navigator.sendBeacon` (Blob) → fallback `fetch(..., { keepalive: true })`. Không `preventDefault`/`await` → điều hướng không bị chặn; event vẫn đi khi trang unload. ✅
- `bio-tracker.tsx` (page_view) + `tracked-anchor.tsx` (click) đều fire-and-forget.

### 🐞 BUG ĐÃ SỬA — click event bị mất do lệch tên field

`tracked-anchor.tsx` gửi **snake_case** `{ profile_id, type, target_type, target_id }`, nhưng `/api/track/route.ts` đọc **camelCase** (`body.profileId`, `body.targetType`, `body.targetId`). Hệ quả: route fail check `!profileId` → trả 204 nhưng **bỏ toàn bộ click event** (page_view vẫn chạy vì đi qua `track-client.ts` camelCase).

**Sửa:** gom về dùng chung helper `trackClick()` của `track-client.ts` (camelCase, đúng endpoint, đỡ trùng code). → Click giờ ghi đúng.

---

## 5. REGRESSION CHẶN BUILD — báo Agent 0

Trong lúc QA, codebase đang được **nhiều agent chỉnh sửa trực tiếp** (file xuất hiện/đổi giữa các lần đọc; `.next` bị `pnpm dev` ghi đè liên tục). Các lỗi build gặp phải:

| # | Lỗi | Chủ sở hữu | Trạng thái |
|---|---|---|---|
| 1 | `lucide-react@1.x` đã **gỡ toàn bộ icon thương hiệu** (Facebook/Instagram/YouTube/Twitter) → `platform.tsx` import icon không tồn tại | Agent 4/7 | ✅ Agent owning đã tự xử lý bằng `platform-icon.tsx` (icon generic). Tôi đã **xóa `platform.tsx`** mồ côi (trùng lặp). |
| 2 | Client component `charts/range-tabs.tsx` import `analytics/queries.ts` → kéo theo `supabase/server.ts` (`next/headers`) vào client bundle | Agent 5/6 | ✅ **Tôi sửa:** tách hằng/types client-safe ra `lib/analytics/range.ts`; `queries.ts` re-export; `range-tabs.tsx` import từ `range.ts`. |
| 3 | `products-manager.tsx` import `formatPrice` từ `@/lib/format` nhưng file chỉ export `toPriceCents`/`fromPriceCents` | Agent 6 | ⛔ **MỞ** — Agent 6 đang sửa file này realtime khi tôi quan sát. Cần Agent 6 hoàn tất: export `formatPrice` ở `lib/format.ts` hoặc import từ `components/bio/price.ts` (nơi `formatPrice` đang sống). |

> Vì codebase đang biến động từng giây, tôi **không** tiếp tục vá lớp bio/dashboard (tránh đụng độ với agent đang sửa). Lỗi #3 thuộc Agent 6 và sẽ tự hết khi họ xong.

---

## 6. CÁCH ĐO KPI CUỐI (chạy trên build ĐÔNG CỨNG)

Điều kiện: Agent 4/6/7 đã xong, **tắt `pnpm dev`** (dev server đang ghi đè `.next` và chiếm cổng 3000).

```powershell
# 1) Build sạch
corepack pnpm build      # phải xanh, lint sạch
corepack pnpm start --port 3100

# 2) Đo JS payload thực tế của /@demo (gz từng chunk <script>)
$html = (Invoke-WebRequest 'http://localhost:3100/@demo' -UseBasicParsing).Content
$chunks = [regex]::Matches($html,'/_next/(static/[^"]+?\.js)') |
  ForEach-Object { $_.Groups[1].Value } | Sort-Object -Unique
$gz=0; foreach ($c in $chunks) { $p=Join-Path '.next' $c; if(Test-Path $p){
  $b=[IO.File]::ReadAllBytes($p); $ms=New-Object IO.MemoryStream
  $z=New-Object IO.Compression.GzipStream($ms,'Optimal'); $z.Write($b,0,$b.Length); $z.Close()
  $gz+=$ms.Length } }
"public JS gz = {0:N0} bytes (mục tiêu < 30720)" -f $gz
```

Lighthouse (mobile):

```powershell
npx lighthouse http://localhost:3100/@demo `
  --preset=perf --form-factor=mobile --screenEmulation.mobile `
  --only-categories=performance --output=json --output-path=.\lh-public.json --quiet
```

Mục tiêu nghiệm thu: Perf ≥ 98 · LCP < 1.2s · CLS < 0.02 · TBT < 100ms · TTFB < 200ms.

---

## 7. KIỂM THỬ (đề xuất cho lần chạy cuối)

Chưa thêm Vitest lúc này để **tránh đụng `package.json`/lockfile + làm gián đoạn dev server đang chạy**. Sẵn sàng cho lần đông cứng:

```powershell
corepack pnpm add -D vitest @vitest/coverage-v8
# package.json scripts: "test": "vitest run"
```

Bộ test thuần (hàm pure, đã ổn định) nên có:
- `lib/validation/url.ts`: chặn `javascript:`/`data:`; tự thêm `https://`; chặn host không có `.`.
- `lib/validation/username.ts`: min/max length, pattern `[a-z0-9_]`, reserved names, `normalizeUsername` bỏ `@`.
- (Integration, cần DB test) `set_pinned_products` ≤ 3, `reorder_links/products` đổi `position`.

Luồng E2E (Playwright) ưu tiên: xem `/@demo` → click link bắn track → dashboard hiển thị số sau `revalidateTag`.

---

## 8. VIỆC ĐÃ THỰC HIỆN (tóm tắt thay đổi của Agent 8)

| File | Thay đổi |
|---|---|
| `src/app/robots.ts` | **Mới** — allow `/`, disallow `/dashboard /api /auth /login /signup`, trỏ sitemap. |
| `src/app/sitemap.ts` | **Mới** — liệt kê profile `is_published` (anon select qua RLS) + landing; `revalidate=3600`. |
| `src/lib/analytics/range.ts` | **Mới** — tách `AnalyticsRange`/`ANALYTICS_RANGES`/`parseRange` client-safe (sửa build #2). |
| `src/lib/analytics/queries.ts` | Re-export từ `range.ts` (giữ API cũ). |
| `src/components/dashboard/charts/range-tabs.tsx` | Import từ `range.ts` thay vì `queries.ts`. |
| `src/components/bio/tracked-anchor.tsx` | Sửa bug click event: dùng chung `trackClick()` (camelCase khớp endpoint). |
| `src/components/bio/platform.tsx` | **Xóa** — mồ côi/trùng `platform-icon.tsx`. |
| `next.config.ts` | `images.formats = ["image/avif","image/webp"]`. |
| `src/app/layout.tsx` | Thêm `preconnect`/`dns-prefetch` tới origin Supabase. |
| `.env.local` | **Mới** — URL + publishable key thật (build chạy được); `SUPABASE_SERVICE_ROLE_KEY` để placeholder (cần dán key thật cho luồng signup). |

> Đã có sẵn (xác nhận đạt): `layout.tsx` font `display:swap` + metadata/OG/keywords tiếng Việt đầy đủ; `next.config` cache headers + `optimizePackageImports`.
