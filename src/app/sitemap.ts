import type { MetadataRoute } from "next";
import { createPublicClient } from "@/lib/supabase/public";
import { getAppBaseUrl } from "@/lib/site-url";

// Sitemap đọc danh sách profile published; revalidate nền mỗi giờ (không cần realtime).
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getAppBaseUrl();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${base}/`, changeFrequency: "weekly", priority: 1 },
  ];

  // RLS cho phép anon SELECT profiles khi is_published → không cần service role.
  let profileRoutes: MetadataRoute.Sitemap = [];
  try {
    const supabase = createPublicClient();
    const { data } = await supabase
      .from("profiles")
      .select("username, updated_at")
      .eq("is_published", true)
      .order("updated_at", { ascending: false })
      .limit(50000);

    profileRoutes = (data ?? []).map((p) => ({
      url: `${base}/@${p.username}`,
      lastModified: p.updated_at ? new Date(p.updated_at) : undefined,
      changeFrequency: "daily" as const,
      priority: 0.8,
    }));
  } catch {
    // Sitemap không được phép làm sập build/route nếu DB lỗi tạm thời.
    profileRoutes = [];
  }

  return [...staticRoutes, ...profileRoutes];
}
