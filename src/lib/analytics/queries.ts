import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { type AnalyticsRange } from "@/lib/analytics/range";
import type { Product } from "@/lib/types";

export {
  ANALYTICS_RANGES,
  parseRange,
  rangePeriodLabel,
  type AnalyticsRange,
} from "@/lib/analytics/range";

export type OverviewStats = {
  views: number;
  clicks: number;
  /** clicks / views trong khoảng (0..1); 0 khi chưa có view nào. */
  ctr: number;
};

export type DailyPoint = { day: string; views: number; clicks: number };
export type TopItem = { id: string; title: string; clicks: number };

/** Ngày bắt đầu (YYYY-MM-DD, UTC) của khoảng N ngày tính cả hôm nay. */
function rangeStartIso(days: number): string {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() - (days - 1));
  return d.toISOString().slice(0, 10);
}

/**
 * Chuỗi views/clicks theo ngày, đã điền 0 cho ngày thiếu để biểu đồ liền mạch.
 * Đọc trực tiếp `stats_daily` (rollup) → cực nhanh, đúng KPI dashboard.
 */
export const getDailySeries = cache(
  async (profileId: string, days: AnalyticsRange): Promise<DailyPoint[]> => {
    const supabase = await createClient();
    const start = rangeStartIso(days);

    const { data } = await supabase
      .from("stats_daily")
      .select("day, views, clicks")
      .eq("profile_id", profileId)
      .gte("day", start)
      .order("day", { ascending: true });

    const byDay = new Map<string, { views: number; clicks: number }>();
    for (const row of (data ?? []) as DailyPoint[]) {
      byDay.set(row.day, { views: row.views, clicks: row.clicks });
    }

    const series: DailyPoint[] = [];
    const cursor = new Date(`${start}T00:00:00Z`);
    for (let i = 0; i < days; i++) {
      const key = cursor.toISOString().slice(0, 10);
      const found = byDay.get(key);
      series.push({ day: key, views: found?.views ?? 0, clicks: found?.clicks ?? 0 });
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }
    return series;
  },
);

/** Tổng views/clicks + CTR cho khoảng đang chọn (cộng dồn từ series). */
export async function getOverviewStats(
  profileId: string,
  days: AnalyticsRange,
): Promise<OverviewStats> {
  const series = await getDailySeries(profileId, days);
  const views = series.reduce((sum, p) => sum + p.views, 0);
  const clicks = series.reduce((sum, p) => sum + p.clicks, 0);
  return { views, clicks, ctr: views > 0 ? clicks / views : 0 };
}

/** Top link được bấm nhiều nhất. Qua RPC SECURITY DEFINER (events bị RLS chặn SELECT). */
export async function getTopLinks(
  _profileId: string,
  days: AnalyticsRange,
  limit = 5,
): Promise<TopItem[]> {
  const supabase = await createClient();
  const { data } = await supabase.rpc("get_top_links", {
    p_days: days,
    p_limit: limit,
  });
  return ((data ?? []) as { id: string; title: string; clicks: number | string }[]).map(
    (r) => ({ id: r.id, title: r.title, clicks: Number(r.clicks) }),
  );
}

/** Top sản phẩm được bấm nhiều nhất. */
export async function getTopProducts(
  _profileId: string,
  days: AnalyticsRange,
  limit = 5,
): Promise<TopItem[]> {
  const supabase = await createClient();
  const { data } = await supabase.rpc("get_top_products", {
    p_days: days,
    p_limit: limit,
  });
  return ((data ?? []) as { id: string; title: string; clicks: number | string }[]).map(
    (r) => ({ id: r.id, title: r.title, clicks: Number(r.clicks) }),
  );
}

export type ProductAnalyticsSummary = Pick<
  Product,
  "id" | "title" | "description" | "image_url" | "price_cents" | "currency" | "url" | "is_active"
>;

/** Sản phẩm thuộc profile hiện tại (dùng cho trang analytics chi tiết). */
export async function getProductForAnalytics(
  profileId: string,
  productId: string,
): Promise<ProductAnalyticsSummary | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select("id, title, description, image_url, price_cents, currency, url, is_active")
    .eq("profile_id", profileId)
    .eq("id", productId)
    .maybeSingle();
  return data as ProductAnalyticsSummary | null;
}

/** Tổng lượt bấm sản phẩm trong khoảng (từ RPC top products, tối đa 100 mục). */
export async function getProductClickTotal(
  profileId: string,
  productId: string,
  days: AnalyticsRange,
): Promise<number> {
  const items = await getTopProducts(profileId, days, 100);
  return items.find((item) => item.id === productId)?.clicks ?? 0;
}

/** Chuỗi lượt bấm theo ngày cho một sản phẩm (RPC SECURITY DEFINER). */
export const getProductClickSeries = cache(
  async (productId: string, days: AnalyticsRange): Promise<DailyPoint[]> => {
    const supabase = await createClient();
    const start = rangeStartIso(days);

    const { data, error } = await supabase.rpc("get_product_clicks_daily", {
      p_product_id: productId,
      p_days: days,
    });

    const byDay = new Map<string, number>();
    if (!error) {
      for (const row of (data ?? []) as { day: string; clicks: number | string }[]) {
        const key = String(row.day).slice(0, 10);
        byDay.set(key, Number(row.clicks));
      }
    }

    const series: DailyPoint[] = [];
    const cursor = new Date(`${start}T00:00:00Z`);
    for (let i = 0; i < days; i++) {
      const key = cursor.toISOString().slice(0, 10);
      series.push({ day: key, views: 0, clicks: byDay.get(key) ?? 0 });
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }
    return series;
  },
);
