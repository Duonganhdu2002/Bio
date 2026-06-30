/**
 * Shape dữ liệu trả về từ RPC `get_public_profile` (CONTRACT §A.2).
 * Đã sort sẵn: links theo position; pinned 1..3; products theo position.
 */

export interface PublicProfile {
  id: string;
  username: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  cover_url: string | null;
  theme: string;
  layout: string;
  template: string;
}

export interface PublicLink {
  id: string;
  title: string;
  url: string;
  platform: string | null;
  position: number;
}

export interface PublicProductCategory {
  id: string;
  name: string;
  section?: "product" | "brand";
  position: number;
}

export interface PublicPinnedProduct {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  price_cents: number | null;
  currency: string;
  url: string | null;
  category_id: string | null;
  brand_id: string | null;
  pinned_position: number;
}

export interface PublicProduct {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  price_cents: number | null;
  currency: string;
  url: string | null;
  position: number;
  is_pinned: boolean;
  pinned_position: number | null;
  category_id: string | null;
  brand_id: string | null;
}

export interface PublicBanner {
  id: string;
  name: string;
  image_url: string;
  url: string | null;
  section?: "for_you" | "brand";
  position: number;
}

export interface PublicProfilePayload {
  profile: PublicProfile;
  links: PublicLink[];
  categories: PublicProductCategory[];
  banners: PublicBanner[];
  pinned: PublicPinnedProduct[];
  products: PublicProduct[];
}
