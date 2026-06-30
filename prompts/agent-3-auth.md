# AGENT 3 — Auth & Account

> Dự án **Bio** (link-in-bio). Code vào `D:\Bio\Bio`. Học convention từ `D:\Bio\CODE` (CHỈ ĐỌC).

---

## VAI TRÒ
Đăng ký/đăng nhập, chọn username, middleware session, bảo vệ `/dashboard`.

## CONTEXT BẮT BUỘC ĐỌC TRONG `CODE`
`src/app/login/login-form.tsx`, `src/lib/supabase/{server,client,middleware}.ts`, `src/middleware.ts`, `src/app/auth/callback/route.ts`.

## NHIỆM VỤ CHI TIẾT
1. Tạo `src/lib/supabase/{server,client,middleware}.ts` copy pattern `CODE` (cached server client, browser client, `updateSession`).
2. `src/middleware.ts`: chỉ match `/dashboard/:path*`, `/login`, `/signup` — **public bio `/@...` & `/api/track` KHÔNG đi qua middleware** (giữ TTFB thấp). Chưa auth vào `/dashboard` → `/login`; đã auth vào `/login` → `/dashboard`.
3. `/signup`: form email + password + **username** (check khả dụng real-time qua `select`/RPC); validate username (a-z0-9_, 3-30 ký tự, không trùng) bằng `lib/validation/username.ts`. Server Action tạo user + set `profiles.username`.
4. `/login`: email + password (`signInWithPassword`) giống `CODE` nhưng BỎ allowlist (self-serve). Có link sang `/signup`.
5. `/auth/callback/route.ts`: xử lý exchange code (hỗ trợ session; sẵn sàng cho magic link/oauth sau).
6. `signOut` action; helper `getCurrentProfile()` (server, dùng cached client) trả profile user hiện tại.
7. UI dùng `Card`, `Input`, `Label`, `Button`, `Alert` của design system (Agent 7). Thông báo lỗi tiếng Việt.

## DEFINITION OF DONE
Đăng ký tạo profile + username unique; đăng nhập vào `/dashboard`; chưa login vào `/dashboard` bị đẩy về `/login`; username trùng bị chặn với thông báo tiếng Việt.

## PHỤ THUỘC
Cần Agent 1 (scaffold), Agent 2 (bảng `profiles` + ràng buộc username), Agent 7 (UI primitives). Bàn giao cho Agent 6 (dashboard).

---

## HỢP ĐỒNG CHUNG (data contract + convention — bắt buộc)

### Convention học từ `CODE`
`server.ts` dùng `cache()`; `middleware.ts` chỉ match route auth; Server Action `"use server"` trả discriminated union (xem `deals/actions.ts`); UI tiếng Việt; theme oklch tím; shadcn trên `@base-ui/react`.

### Data model (phần liên quan)
- **profiles**(id uuid = auth.users.id, username citext UNIQUE NOT NULL, display_name, bio, avatar_url, theme default 'default', is_published bool default true, created_at, updated_at).
- Tạo profile khi signup: theo cách Agent 2 đã chốt trong `CONTRACT.md` (trigger `handle_new_user` hoặc server action). Username phải unique, validate trước khi insert.

### Routes
`/login`, `/signup`, `/auth/callback`, `/dashboard/*` (protected). Public `/@[username]` và `/api/track` KHÔNG qua middleware.

### KPI
Middleware nhẹ, chỉ chạy `getUser()` trên route cần auth để giữ TTFB public thấp.
