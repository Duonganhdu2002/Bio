/**
 * Type của data contract (xem `CONTRACT.md` §A.2). Owner: Agent 2 (database).
 *
 * CHỐT: giữ type viết tay thay vì `supabase gen types` — đã đối chiếu khớp 100% với
 * `supabase/migrations/0001_init.sql` (mọi cột + nullability). Lý do không generate:
 * generate cho shape lồng `Database['public']['Tables'][...]['Row']`, buộc mọi agent
 * sửa import; các interface phẳng `Profile/Link/Product/AnalyticsEvent/StatsDaily`
 * dưới đây là source nhẹ, ổn định mà Agent 3/4/5/6 đang dùng trực tiếp.
 * Khi đổi schema: cập nhật migration TRƯỚC rồi đồng bộ thủ công file này.
 */

export type ThemeKey = string;

export interface Profile {
  id: string;
  username: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  cover_url: string | null;
  theme: ThemeKey;
  layout: string;
  template: string;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface Link {
  id: string;
  profile_id: string;
  title: string;
  url: string;
  platform: string | null;
  position: number;
  is_active: boolean;
  created_at: string;
}

export interface ProductCategory {
  id: string;
  profile_id: string;
  name: string;
  section: "product" | "brand";
  position: number;
  created_at: string;
}

export interface Product {
  id: string;
  profile_id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  price_cents: number | null;
  currency: string;
  url: string | null;
  category_id: string | null;
  brand_id: string | null;
  position: number;
  is_pinned: boolean;
  pinned_position: number | null;
  is_active: boolean;
  created_at: string;
}

import type { BannerSection } from "@/lib/banner-section";

export interface ProfileBanner {
  id: string;
  profile_id: string;
  name: string;
  image_url: string;
  url: string | null;
  section: BannerSection;
  position: number;
  is_active: boolean;
  created_at: string;
}

export type EventType = "page_view" | "click";
export type EventTargetType = "link" | "product" | null;

export interface AnalyticsEvent {
  id: number;
  profile_id: string;
  type: EventType;
  target_type: EventTargetType;
  target_id: string | null;
  referrer: string | null;
  country: string | null;
  device: string | null;
  created_at: string;
}

export interface StatsDaily {
  profile_id: string;
  day: string;
  views: number;
  clicks: number;
}
