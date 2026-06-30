# AGENT 2 — Database & Supabase

> Dự án **Bio** (link-in-bio). Code vào `D:\Bio\Bio`. Học convention từ `D:\Bio\CODE` (CHỈ ĐỌC).

---

## VAI TRÒ
Thiết kế schema, RLS, RPC, index, migration, seed, types.

## CONTEXT ĐỌC
`CODE/src/lib/supabase/*` (cách app gọi RPC / client). Đọc kỹ "HỢP ĐỒNG CHUNG" bên dưới — đây là SOURCE OF TRUTH.

## NHIỆM VỤ CHI TIẾT
1. Migration SQL trong `Bio/supabase/migrations/`: `0001_init.sql`, `0002_rls.sql`, `0003_rpc.sql`, `0004_indexes.sql`.
2. Tạo bảng theo data model chính xác từng cột/kiểu/ràng buộc. Bật extension `citext`, `pgcrypto`.
3. Trigger `updated_at` tự cập nhật trên `profiles`.
4. Tạo profile cho user mới: chọn 1 cách (trigger `handle_new_user` cho phép username null tạm, HOẶC tạo profile trong server action signup) — ghi rõ lựa chọn vào CONTRACT.
5. **RLS policies:**
   - `profiles`: chủ sở hữu (`auth.uid()=id`) full CRUD; anon SELECT chỉ khi `is_published`.
   - `links`/`products`: chủ sở hữu full CRUD (`profile_id=auth.uid()`); anon KHÔNG select trực tiếp (public đọc qua RPC definer).
   - `events`: anon/auth KHÔNG select/insert trực tiếp; chỉ ghi qua `track_event` (SECURITY DEFINER).
   - `stats_daily`: chủ sở hữu SELECT.
6. **RPC** (mỗi hàm: validate input, kiểm ownership trừ public/track, `SECURITY DEFINER` + `SET search_path = public`):
   - `get_public_profile(p_username citext)` → 1 JSON `{profile, links[], pinned[≤3], products[]}` đã sort sẵn (pinned 1..3 trước rồi position). Chỉ trả khi `is_published`. Dùng index lookup username, tránh N+1.
   - `track_event(p_profile_id, p_type, p_target_type, p_target_id, p_referrer, p_country, p_device)` → insert `events` + upsert `stats_daily` (+1 views/clicks).
   - `set_pinned_products(p_product_ids uuid[])` → atomically gán pinned_position 1..3 cho user hiện tại, bỏ ghim phần còn lại, tối đa 3.
   - `reorder_links(p_ids uuid[])` / `reorder_products(p_ids uuid[])` → set position theo thứ tự mảng.
7. **Index & ràng buộc:** partial unique `(profile_id, pinned_position) WHERE is_pinned`; CHECK `pinned_position BETWEEN 1 AND 3`; index `links(profile_id,position)`, `products(profile_id,is_pinned,position)`, `events(profile_id,created_at)`, `stats_daily(profile_id,day)`.
8. `seed.sql`: 1 user demo + vài link + 5 product (3 ghim) + vài event.
9. Sinh TypeScript types vào `src/lib/types.ts` (khớp schema; có thể `supabase gen types` rồi tinh chỉnh).
10. `Bio/supabase/README.md`: hướng dẫn chạy migration (CLI hoặc dán SQL).

## TỐI ƯU TỐC ĐỘ
`get_public_profile` dùng index, trả JSON build sẵn (client khỏi xử lý); `track_event` nhẹ để client gọi fire-and-forget.

## DEFINITION OF DONE
Migration chạy sạch trên Supabase mới; anon KHÔNG đọc `links`/`events` trực tiếp nhưng `get_public_profile` trả đủ dữ liệu published; `set_pinned_products` enforce ≤3 và unique vị trí ghim.

## BÀN GIAO CHO
Agent 3 (auth dùng profiles), Agent 4 (RPC public), Agent 5 (track + stats), Agent 6 (CRUD + reorder + pin).

---

## HỢP ĐỒNG CHUNG (đầy đủ data model — bắt buộc)

### Stack & convention
Next.js 16 (React 19 + Compiler), Supabase, Tailwind v4, shadcn trên `@base-ui/react`, TanStack Query. UI tiếng Việt; alias `@/*`; Server Action trả union; theme oklch tím.

### Data model (schema `public`)
```
profiles(id uuid PK = auth.users.id on delete cascade, username citext UNIQUE NOT NULL,
         display_name text, bio text, avatar_url text, theme text default 'default',
         is_published bool default true, created_at timestamptz default now(), updated_at timestamptz default now())
links(id uuid PK, profile_id uuid FK->profiles cascade, title text NOT NULL, url text NOT NULL,
      platform text, position int NOT NULL default 0, is_active bool default true, created_at timestamptz default now())
products(id uuid PK, profile_id uuid FK->profiles cascade, title text NOT NULL, description text,
         image_url text, price_cents int, currency text default 'VND', url text,
         position int NOT NULL default 0, is_pinned bool default false,
         pinned_position smallint CHECK(pinned_position BETWEEN 1 AND 3),
         is_active bool default true, created_at timestamptz default now())
events(id bigint identity PK, profile_id uuid FK cascade, type text NOT NULL,  -- 'page_view'|'click'
       target_type text, target_id uuid, referrer text, country text, device text,
       created_at timestamptz default now())
stats_daily(profile_id uuid, day date, views int default 0, clicks int default 0, PRIMARY KEY(profile_id,day))
```

### Routes liên quan
Public `/@[username]` đọc qua `get_public_profile`; `/api/track` (edge) gọi `track_event`; dashboard đọc `stats_daily`.
