# Bio — Supabase (DB, RLS, RPC)

Schema, RLS, RPC, index, seed cho dự án Bio (link-in-bio). Đây là phần triển khai
[**Data Contract**](../CONTRACT.md#a2-data-contract-supabase--source-of-truth).

## Cấu trúc

```
supabase/
  migrations/
    0001_init.sql      # extensions (pgcrypto, citext), bảng, trigger updated_at
    0002_rls.sql       # bật RLS + policies
    0003_rpc.sql       # RPC: get_public_profile, track_event, set_pinned_products, reorder_*
    0004_indexes.sql   # partial unique pinned + index
  seed.sql             # user demo + links + 5 product (3 ghim) + event
```

Thứ tự apply: **0001 → 0002 → 0003 → 0004 → seed**.

## Cách chạy

### Cách 1 — Supabase CLI (khuyến nghị)

```bash
# Local stack
supabase start
supabase db reset          # apply mọi migration trong migrations/ + chạy seed.sql

# Hoặc đẩy lên project remote đã link
supabase link --project-ref <project-ref>
supabase db push
```

> `supabase db reset` tự chạy `seed.sql`. Nếu seed riêng: `psql "$DATABASE_URL" -f supabase/seed.sql`.

### Cách 2 — Dán SQL vào Supabase Studio

Vào **SQL Editor** của project, dán nội dung từng file **theo đúng thứ tự**
`0001 → 0002 → 0003 → 0004` rồi (tuỳ chọn) `seed.sql`, chạy lần lượt.

## Quyết định thiết kế

- **Tạo profile cho user mới:** tạo trong **server action signup** (Agent 3), không dùng
  trigger `handle_new_user`. Lý do: `profiles.username` là `NOT NULL` và do user tự chọn lúc
  đăng ký; tạo ở signup giữ ràng buộc này sạch sẽ, tránh username placeholder. Policy
  `profiles_insert_self` (`id = auth.uid()`) cho phép user tự insert profile bằng session của
  chính mình.
- **events**: RLS bật, **không có policy** → chặn mọi select/insert trực tiếp từ anon/auth.
  Chỉ ghi qua `track_event` (SECURITY DEFINER). `stats_daily`: chủ sở hữu chỉ SELECT.
- **get_public_profile**: trả 1 JSON build sẵn, đã sort (pinned 1..3 trước, rồi position),
  chỉ khi `is_published` → trang public chỉ cần **1 round-trip**.

## Sinh lại TypeScript types

Types đang viết tay ở [`../src/lib/types.ts`](../src/lib/types.ts). Muốn sinh tự động:

```bash
supabase gen types typescript --local > src/lib/database.types.ts
# hoặc: --project-id <ref> --schema public
```

## User demo (sau khi seed)

- Email: `demo@bio.test` · Mật khẩu: `demo123456`
- Username: `demo` → trang public `/@demo`

## Đã kiểm thử

Đã apply + verify trên project Supabase `Bio` (ref `dprusybvaemmxorlidyx`, Postgres 17):
4 migration + seed chạy sạch; `get_public_profile('demo')` trả JSON đúng (pinned sort 1→3),
`track_event` cộng dồn `stats_daily` chính xác.

`get_advisors` (security) — các cảnh báo còn lại đều **đúng theo thiết kế**:

- `rls_enabled_no_policy` trên `events` (INFO): cố ý — chỉ ghi qua `track_event` (definer), chặn truy cập trực tiếp.
- `*_security_definer_function_executable` (WARN): các RPC `SECURITY DEFINER` lộ qua REST là chủ đích
  (public: `get_public_profile`, `track_event`; authenticated: `set_pinned_products`, `reorder_*`),
  mỗi hàm tự kiểm ownership/validate input bên trong.
- `extension_in_public` cho `citext` (WARN, cosmetic): có thể chuyển sang schema `extensions` nếu muốn dọn sạch.
- `auth_leaked_password_protection` (WARN): cấu hình Auth — thuộc phạm vi Agent 3.
