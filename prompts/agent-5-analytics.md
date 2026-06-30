# AGENT 5 — Analytics & Tracking

> Dự án **Bio** (link-in-bio). Code vào `D:\Bio\Bio`. Học convention từ `D:\Bio\CODE` (CHỈ ĐỌC).

---

## VAI TRÒ
Đường ống thu thập sự kiện + tổng hợp + biểu đồ dashboard.

## CONTEXT ĐỌC
RPC `track_event`, bảng `events`/`stats_daily` (Agent 2); component `BioTracker` (Agent 4); `CODE/src/lib/supabase/*`.

## NHIỆM VỤ CHI TIẾT
1. `app/api/track/route.ts` — **edge runtime** (`export const runtime = 'edge'`), POST:
   - Parse body (hỗ trợ `sendBeacon` gửi `text/plain` JSON).
   - Đọc `country` từ header CDN (vd `x-vercel-ip-country`), `referrer`, `user-agent` → suy ra `device`.
   - Gọi RPC `track_event` qua Supabase (anon key — RPC là definer). Trả `204` nhanh.
   - Rate-limit nhẹ chống spam (theo IP + profile; in-memory hoặc Upstash optional).
2. `lib/analytics/track-client.ts`: `trackPageView(profileId)` và `trackClick(profileId, targetType, targetId)` dùng `navigator.sendBeacon` (fallback `fetch` `keepalive:true`).
3. `lib/analytics/device.ts`: parse UA → `mobile|tablet|desktop` (nhẹ, không thư viện nặng).
4. **Aggregation đọc nhanh:** dashboard đọc `stats_daily` cho biểu đồ theo ngày (7/30/90 ngày); top links/products group trên `events` (có index) hoặc bảng rollup riêng nếu cần.
5. Server functions/queries cho dashboard: `getOverviewStats(profileId, range)`, `getDailySeries`, `getTopLinks`, `getTopProducts`.
6. Component biểu đồ `components/dashboard/charts/`: line chart views/clicks + bảng top. Dùng chart nhẹ hoặc SVG tự vẽ (tránh bundle nặng). **Chỉ client component ở `/dashboard/analytics`**, không kéo vào trang public.
7. (Tùy chọn) Cron/Edge function gộp `events` cũ giữ bảng gọn.

## DEFINITION OF DONE
Click & view từ trang public xuất hiện trong dashboard sau ~vài giây; biểu đồ 7/30 ngày đúng số liệu seed; `/api/track` trả 204, chịu gọi liên tục, KHÔNG làm chậm điều hướng link.

## PHỤ THUỘC
Cần Agent 2 (RPC + bảng). Bàn giao số liệu cho Agent 6 (dashboard tổng quan + analytics).

---

## HỢP ĐỒNG CHUNG (bắt buộc)

### Tracking contract
POST `/api/track` (edge) body JSON: `{profileId, type:'page_view'|'click', targetType?:'link'|'product', targetId?, referrer?, device?}`. Server bổ sung `country` từ header CDN rồi gọi `track_event`.

### RPC dùng
`track_event(p_profile_id, p_type, p_target_type, p_target_id, p_referrer, p_country, p_device)` → insert `events` + upsert `stats_daily` (+1 views/clicks). SECURITY DEFINER, không cần auth.

### Data model (phần analytics)
- **events**(id bigint, profile_id, type 'page_view'|'click', target_type 'link'|'product'|null, target_id uuid, referrer, country, device, created_at).
- **stats_daily**(profile_id, day date, views int, clicks int, PK(profile_id,day)).
- RLS: anon KHÔNG select/insert `events` trực tiếp; `stats_daily` chỉ chủ sở hữu SELECT.

### Convention
Next.js 16 (React 19), Supabase SSR client (`cache()`), UI tiếng Việt, shadcn trên `@base-ui/react`, theme oklch tím. Chart dùng dynamic import để không vào bundle public.

### KPI
`/api/track` < vài chục ms, không block điều hướng; dashboard đọc rollup nên nhanh; bundle public KHÔNG chứa thư viện chart.
