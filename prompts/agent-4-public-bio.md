# AGENT 4 — Public Bio Page (TRỌNG TÂM TỐC ĐỘ)

> Dự án **Bio** (link-in-bio). Code vào `D:\Bio\Bio`. Học convention từ `D:\Bio\CODE` (CHỈ ĐỌC).

---

## VAI TRÒ
Xây trang public `/@[username]` siêu nhanh, đẹp — bộ mặt sản phẩm.

## CONTEXT BẮT BUỘC ĐỌC TRONG `CODE`
`src/app/p/[token]/page.tsx` + `portal-client.tsx` (pattern public page), `src/app/layout.tsx`. Dùng RPC `get_public_profile` (Agent 2) + component `components/bio/*` (Agent 7).

## NHIỆM VỤ CHI TIẾT
1. Route `app/[username]/page.tsx` (nhóm public), **chủ yếu RSC**, KHÔNG bọc QueryProvider, KHÔNG sidebar.
2. Lấy dữ liệu **1 round-trip** bằng `get_public_profile(username)`. Không tồn tại / `is_published=false` → `notFound()`.
3. **Caching:** ISR `export const revalidate = 60` (hoặc `unstable_cache` tag theo username) + on-demand `revalidateTag('profile:'+username)` (Agent 6 gọi khi user sửa). Set headers cache CDN phù hợp.
4. `generateMetadata`: title/description/OG theo profile (avatar làm OG), `lang="vi"`.
5. **Bố cục** (component trong `components/bio/`):
   - `ProfileHeader`: avatar (`next/image`, `priority`, width/height cố định), display_name, bio.
   - `PinnedRail`: tối đa **3 sản phẩm ghim** nổi bật trên cùng (card lớn, badge "Nổi bật").
   - `LinkList`: `LinkButton` (icon theo `platform` từ `lucide-react`), full-width, tap target ≥ 44px.
   - `ProductGrid`: sản phẩm còn lại.
   - Footer CTA "Tạo bio của bạn" → landing.
6. **Tracking (fire-and-forget, KHÔNG chặn render/điều hướng):**
   - Client component mỏng `BioTracker`: gửi `page_view` qua `navigator.sendBeacon('/api/track', ...)` khi mount (1 lần).
   - `LinkButton`/`ProductCard` khi click: gọi `sendBeacon` event `click` (`target_type`+`target_id`) **rồi mới** điều hướng. Tuyệt đối KHÔNG await trước khi mở link.
   - `referrer`+`device` lấy client (`lib/analytics/device.ts`); `country` server đọc từ header CDN tại `/api/track`.
7. Responsive mobile-first; theme từ `profiles.theme` (preset của Agent 7). Tránh CLS (kích thước cố định ảnh/skeleton).
8. JS client tối thiểu — chỉ `BioTracker` + handler click; phần còn lại RSC.

## DEFINITION OF DONE
Render đẹp với seed data; Lighthouse mobile Perf ≥ 98, LCP < 1.2s, CLS < 0.02; page_view & click ghi vào `events`/`stats_daily`; username không tồn tại → trang 404 đẹp.

## PHỤ THUỘC
Cần Agent 2 (RPC), Agent 7 (UI), Agent 5 (`/api/track` + `track-client`). Phối hợp Agent 6 (revalidateTag).

---

## HỢP ĐỒNG CHUNG (bắt buộc)

### Convention `CODE`
Public page giống `src/app/p/[token]` — RSC, không QueryProvider, không middleware. UI tiếng Việt; theme oklch; shadcn trên `@base-ui/react`; `next/image` cho ảnh.

### RPC dùng
`get_public_profile(p_username citext)` → JSON `{profile, links[], pinned[≤3], products[]}` đã sort sẵn (pinned 1..3 trước rồi position), chỉ trả khi `is_published`.

### Data model (phần hiển thị)
- **profiles**(username, display_name, bio, avatar_url, theme, is_published).
- **links**(title, url, platform, position, is_active).
- **products**(title, description, image_url, price_cents, currency, url, position, is_pinned, pinned_position 1..3, is_active).

### Tracking contract
POST `/api/track` (edge) body JSON: `{profileId, type:'page_view'|'click', targetType?, targetId?, referrer?, device?}`. Client gọi qua `lib/analytics/track-client.ts` bằng `sendBeacon` (fallback `fetch keepalive:true`).

### KPI tốc độ (bắt buộc đạt)
Perf ≥ 98 mobile, LCP < 1.2s, CLS < 0.02, TTFB < 200ms (ISR+CDN), JS public < 30KB gz, data 1 round-trip.
