# Bio — Nền tảng Link-in-Bio (kiểu Linktree/Beacons)

Tạo một trang bio công khai tại `/@username`: gắn link mạng xã hội, quản lý **sản phẩm**, **ghim tối đa 3 sản phẩm lên top**, và **thống kê lượt xem / lượt click** theo thời gian.

> **Ưu tiên số 1: TỐC ĐỘ.** Trang public phải đạt Lighthouse Performance ≥ 98, LCP < 1.2s (4G), TTFB < 200ms qua CDN, JS payload public < 30KB gzip.

---

## Kiến trúc

- **Frontend/Server:** Next.js 16 (App Router, React 19 + React Compiler), TypeScript.
- **Backend:** Supabase — Postgres + Auth + RLS + Storage. Mọi đọc dữ liệu public đi qua RPC `get_public_profile` (SECURITY DEFINER) để giữ **1 round-trip** và không lộ bảng cho anon.
- **UI:** Tailwind CSS v4 + shadcn (trên `@base-ui/react`), theme token `oklch`, accent tím (violet). UI tiếng Việt.
- **Data fetching dashboard:** TanStack Query (chỉ trong dashboard, KHÔNG dùng ở trang public để giữ JS nhẹ).
- **Analytics:** client gửi event fire-and-forget bằng `navigator.sendBeacon` → `/api/track` (edge runtime) → RPC `track_event` (ghi `events` + upsert `stats_daily`).

### Nguyên tắc tốc độ

- Trang public **chủ yếu RSC**, không bọc QueryProvider/sidebar; ISR `revalidate` + `revalidateTag(profile:${username})` khi user sửa.
- Tracking không bao giờ chặn điều hướng (sendBeacon / `keepalive`).
- `next/image` với width/height cố định; avatar `priority`; tránh CLS.

### Mô hình dữ liệu & route

Xem **[`CONTRACT.md`](./CONTRACT.md)** — đây là **source of truth** cho schema, RPC, RLS, routes, KPI và cấu trúc thư mục. Mọi thay đổi schema/route/type phải cập nhật `CONTRACT.md` TRƯỚC.

---

## Cách chạy

> Yêu cầu: **pnpm**, Node ≥ 20, một project Supabase (hoặc Supabase CLI local).

```bash
# 1. Cài dependencies
pnpm install

# 2. Cấu hình môi trường
cp .env.local.example .env.local
# Điền: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY,
#       SUPABASE_SERVICE_ROLE_KEY, NEXT_PUBLIC_SITE_URL

# 3. Chạy migration Supabase
#    - Cách A (CLI):  supabase db push   (hoặc supabase migration up)
#    - Cách B: dán lần lượt các file supabase/migrations/*.sql vào SQL Editor
#    - (tùy chọn) seed dữ liệu demo: chạy supabase/seed.sql
#    Chi tiết: supabase/README.md

# 4. Phát triển
pnpm dev        # http://localhost:3000

# 5. Build & kiểm tra
pnpm build
pnpm lint
```

### Scripts

| Lệnh | Mô tả |
|---|---|
| `pnpm dev` | Chạy dev server |
| `pnpm build` | Build production |
| `pnpm start` | Chạy bản build |
| `pnpm lint` | ESLint |

---

## Quy ước làm việc (đa agent)

- **KHÔNG** sửa thư mục `D:\Bio\CODE` — chỉ đọc để học convention & UI.
- Toàn bộ source đặt trong `D:\Bio\Bio`.
- Đổi schema/route/type → cập nhật `CONTRACT.md` trước → báo Agent 0 để đồng bộ agent phụ thuộc.
- Sau mỗi agent: chạy `pnpm lint && pnpm build`, sửa lỗi trước khi bàn giao.

### Sơ đồ phụ thuộc (thứ tự chạy)

```
Agent 1 (Scaffold)
   ├─> Agent 2 (Database)
   ├─> Agent 7 (Design System)
   │       ├─> Agent 4 (Public Bio Page)
   │       └─> Agent 6 (Dashboard CRUD)
   ├─> Agent 3 (Auth) ─> Agent 6 (Dashboard CRUD)
   └─> Agent 5 (Analytics)
Agent 8 (Performance & QA)   — chạy cuối / xuyên suốt
Agent 0 (Orchestrator)       — giám sát toàn bộ
```

### Checklist bàn giao (ai phụ thuộc output nào)

| Agent | Cần input từ | Bàn giao cho | Artifact chính |
|---|---|---|---|
| **1 Scaffold** | — | 2, 3, 7 | `package.json`, config, `globals.css`, `layout.tsx`, `lib/utils.ts`, `query-provider.tsx`, `.env.local.example` |
| **2 Database** | 1 | 3, 4, 5, 6 | `supabase/migrations/*.sql`, `seed.sql`, RPC, RLS, `src/lib/types.ts` |
| **7 Design System** | 1 | 4, 6 | `components/ui/*`, theme preset, `components/bio/*`, `app-shell`, `app-sidebar` |
| **3 Auth** | 1, 2 | 6 | `lib/supabase/{server,client,middleware}.ts`, `src/middleware.ts`, login/signup, `getCurrentProfile()` |
| **4 Public Bio** | 2 (RPC), 7 (UI) | 8 | `app/[username]/page.tsx`, `BioTracker`, ISR + `generateMetadata` |
| **5 Analytics** | 2 (RPC/tables) | 6, 8 | `app/api/track/route.ts` (edge), `lib/analytics/*`, queries + charts |
| **6 Dashboard CRUD** | 2, 3, 5, 7 | 8 | `(dashboard)/*`, CRUD link/product, ghim top 3, reorder, appearance, settings |
| **8 Performance & QA** | tất cả | 0 | KPI A.5, `sitemap.ts`/`robots.ts`, `PERF_REPORT.md` |

---

## Trạng thái dự án (Agent 0 cập nhật)

> Cập nhật lần cuối: 2026-06-18 bởi Agent 0 (sau rà soát note Agent 3).

| Agent | Vai trò | Trạng thái | Ghi chú |
|---|---|---|---|
| 0 Orchestrator | Contract, README, điều phối, build/lint tổng | ✅ Done (vòng 2) | Đã rà note Agent 3, đồng bộ CONTRACT |
| 1 Scaffold | Khung Next.js 16 + config + theme + font | ✅ Done | Project dựng xong, `pnpm install/lint/build` pass, theme tím + font Roboto, landing tạm OK |
| 2 Database | Schema, RLS, RPC, index, seed, types | ✅ Done | migrations 0001-0004 + seed + `supabase/README.md`; chốt profile-at-signup; RPC đủ 5 hàm |
| 3 Auth | Signup/login, username, middleware | ✅ Done | clients + `src/middleware.ts` + signup/login/callback + `getCurrentProfile`/`signOut` |
| 4 Public Bio | Trang `/@username` siêu nhanh | ⬜ Chưa bắt đầu | Chờ Agent 7 (UI) — đã có RPC `get_public_profile` |
| 5 Analytics | Tracking edge + rollup + biểu đồ | ⬜ Chưa bắt đầu | Đã có RPC `track_event` + `stats_daily` |
| 6 Dashboard CRUD | CRUD link/sản phẩm, ghim top 3, kéo-thả | ⬜ Chưa bắt đầu | Chờ Agent 5, 7 |
| 7 Design System | shadcn UI + theme preset | 🟡 Một phần | Đã có Card/Input/Label/Button/Alert/Tooltip (Agent 3 cần); còn dialog/sheet/sidebar/bio/* |
| 8 Performance & QA | Nghiệm thu KPI, SEO, test | ⬜ Chưa bắt đầu | Chạy cuối |

**Cần Agent 2 xác nhận (từ rà soát note Agent 3):**
- `src/lib/types.ts` (owner Agent 2) hiện do Agent 3 tạo, Agent 0 đối chiếu khớp 100% schema → xác nhận giữ hoặc thay bằng `supabase gen types` (giữ alias interface để không vỡ import).
- Đồng thuận: signup insert profile qua **service-role admin** (robust khi bật email-confirm); `profiles_insert_self` giữ cho owner-insert ở dashboard.

**Build/Lint tổng:** ✅ Pass sau Agent 1 (`pnpm install/lint/build` exit 0, dùng `corepack pnpm`). ⏳ Cần chạy lại sau Agent 7 + 4/5/6. Agent 0 sẽ tổng hợp lỗi và phân lại.

Chú thích trạng thái: ✅ Done · 🟡 Đang làm · ⬜ Chưa bắt đầu · ⏸️ Chờ điều kiện · ❌ Lỗi cần xử lý.
