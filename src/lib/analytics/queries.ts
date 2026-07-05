import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { type AnalyticsRange } from "@/lib/analytics/range";
import type { Product, Link, ProfileBanner } from "@/lib/types";

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

export type ProductClickRow = {
  id: string;
  title: string;
  image_url: string | null;
  is_active: boolean;
  clicks: number;
  /** % trên tổng lượt bấm sản phẩm trong khoảng (0..100). */
  share: number;
};

export type ClickAnalyticsRow = {
  id: string;
  title: string;
  subtitle?: string | null;
  image_url: string | null;
  is_active: boolean;
  clicks: number;
  share: number;
};

export type ClickAnalyticsSummary = {
  totalClicks: number;
  itemsWithClicks: number;
  totalItems: number;
  avgClicksPerItem: number;
  topItemShare: number;
};

export type ProductClicksSummary = ClickAnalyticsSummary & {
  productsWithClicks: number;
  totalProducts: number;
  avgClicksPerProduct: number;
  topProductShare: number;
};

function buildClickSummary(rows: ClickAnalyticsRow[]): ClickAnalyticsSummary {
  const withClicks = rows.filter((r) => r.clicks > 0);
  const totalClicks = withClicks.reduce((sum, r) => sum + r.clicks, 0);
  return {
    totalClicks,
    itemsWithClicks: withClicks.length,
    totalItems: rows.length,
    avgClicksPerItem:
      withClicks.length > 0 ? Math.round((totalClicks / withClicks.length) * 10) / 10 : 0,
    topItemShare: withClicks[0]?.share ?? 0,
  };
}

async function fetchTargetClicksDaily(
  profileId: string,
  days: AnalyticsRange,
  rpcName: "get_all_link_clicks_daily" | "get_all_banner_clicks_daily" | "get_all_product_clicks_daily",
  topItems: () => Promise<TopItem[]>,
  itemSeries: (id: string) => Promise<DailyPoint[]>,
): Promise<DailyPoint[]> {
  const start = rangeStartIso(days);

  if (days === 1) {
    const top = await topItems();
    const total = top.reduce((sum, p) => sum + p.clicks, 0);
    return [{ day: start, views: 0, clicks: total }];
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc(rpcName, { p_days: days });

  const byDay = new Map<string, number>();
  if (!error) {
    for (const row of (data ?? []) as { day: string; clicks: number | string }[]) {
      const key = String(row.day).slice(0, 10);
      byDay.set(key, Number(row.clicks));
    }
  } else {
    const top = await topItems();
    const seriesList = await Promise.all(top.map((item) => itemSeries(item.id)));
    for (const series of seriesList) {
      for (const point of series) {
        byDay.set(point.day, (byDay.get(point.day) ?? 0) + point.clicks);
      }
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
}

async function fetchItemClickSeries(
  profileId: string,
  itemId: string,
  days: AnalyticsRange,
  rpcName: "get_link_clicks_daily" | "get_banner_clicks_daily" | "get_product_clicks_daily",
  rpcArgs: Record<string, unknown>,
  totalFn: () => Promise<number>,
): Promise<DailyPoint[]> {
  const start = rangeStartIso(days);

  if (days === 1) {
    const total = await totalFn();
    return [{ day: start, views: 0, clicks: total }];
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc(rpcName, { ...rpcArgs, p_days: days });

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
}

/** Tổng lượt bấm sản phẩm theo ngày (mọi sản phẩm). */
export const getAllProductClicksDaily = cache(
  async (profileId: string, days: AnalyticsRange): Promise<DailyPoint[]> =>
    fetchTargetClicksDaily(
      profileId,
      days,
      "get_all_product_clicks_daily",
      () => getTopProducts(profileId, days, 50),
      (id) => getProductClickSeries(profileId, id, days),
    ),
);

/** Danh sách sản phẩm kèm lượt bấm, sắp xếp theo clicks giảm dần. */
export async function getProductClickRows(
  profileId: string,
  days: AnalyticsRange,
): Promise<ProductClickRow[]> {
  const supabase = await createClient();

  const [productsRes, topRes] = await Promise.all([
    supabase
      .from("products")
      .select("id, title, image_url, is_active")
      .eq("profile_id", profileId)
      .order("position")
      .order("created_at"),
    supabase.rpc("get_top_products", { p_days: days, p_limit: 50 }),
  ]);

  const clickMap = new Map<string, number>();
  for (const row of (topRes.data ?? []) as { id: string; clicks: number | string }[]) {
    clickMap.set(row.id, Number(row.clicks));
  }

  const totalClicks = [...clickMap.values()].reduce((sum, n) => sum + n, 0);

  return ((productsRes.data ?? []) as Pick<Product, "id" | "title" | "image_url" | "is_active">[])
    .map((p) => {
      const clicks = clickMap.get(p.id) ?? 0;
      return {
        id: p.id,
        title: p.title,
        image_url: p.image_url,
        is_active: p.is_active,
        clicks,
        share: totalClicks > 0 ? (clicks / totalClicks) * 100 : 0,
      };
    })
    .sort((a, b) => b.clicks - a.clicks || a.title.localeCompare(b.title, "vi"));
}

/** KPI tổng hợp lượt bấm sản phẩm. */
export async function getProductClicksSummary(
  profileId: string,
  days: AnalyticsRange,
): Promise<ProductClicksSummary> {
  const rows = await getProductClickRows(profileId, days);
  const summary = buildClickSummary(rows);
  return {
    ...summary,
    productsWithClicks: summary.itemsWithClicks,
    totalProducts: summary.totalItems,
    avgClicksPerProduct: summary.avgClicksPerItem,
    topProductShare: summary.topItemShare,
  };
}

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
  async (
    profileId: string,
    productId: string,
    days: AnalyticsRange,
  ): Promise<DailyPoint[]> =>
    fetchItemClickSeries(
      profileId,
      productId,
      days,
      "get_product_clicks_daily",
      { p_product_id: productId },
      () => getProductClickTotal(profileId, productId, days),
    ),
);

/** Top banner được bấm nhiều nhất. */
export async function getTopBanners(
  _profileId: string,
  days: AnalyticsRange,
  limit = 5,
): Promise<TopItem[]> {
  const supabase = await createClient();
  const { data } = await supabase.rpc("get_top_banners", {
    p_days: days,
    p_limit: limit,
  });
  return ((data ?? []) as { id: string; title: string; clicks: number | string }[]).map(
    (r) => ({ id: r.id, title: r.title, clicks: Number(r.clicks) }),
  );
}

/** Tổng lượt bấm link theo ngày. */
export const getAllLinkClicksDaily = cache(
  async (profileId: string, days: AnalyticsRange): Promise<DailyPoint[]> =>
    fetchTargetClicksDaily(
      profileId,
      days,
      "get_all_link_clicks_daily",
      () => getTopLinks(profileId, days, 50),
      (id) => getLinkClickSeries(profileId, id, days),
    ),
);

/** Tổng lượt bấm banner theo ngày. */
export const getAllBannerClicksDaily = cache(
  async (profileId: string, days: AnalyticsRange): Promise<DailyPoint[]> =>
    fetchTargetClicksDaily(
      profileId,
      days,
      "get_all_banner_clicks_daily",
      () => getTopBanners(profileId, days, 50),
      (id) => getBannerClickSeries(profileId, id, days),
    ),
);

/** Danh sách link kèm lượt bấm. */
export async function getLinkClickRows(
  profileId: string,
  days: AnalyticsRange,
): Promise<ClickAnalyticsRow[]> {
  const supabase = await createClient();
  const [linksRes, topRes] = await Promise.all([
    supabase
      .from("links")
      .select("id, title, url, platform, is_active")
      .eq("profile_id", profileId)
      .order("position")
      .order("created_at"),
    supabase.rpc("get_top_links", { p_days: days, p_limit: 50 }),
  ]);

  const clickMap = new Map<string, number>();
  for (const row of (topRes.data ?? []) as { id: string; clicks: number | string }[]) {
    clickMap.set(row.id, Number(row.clicks));
  }
  const totalClicks = [...clickMap.values()].reduce((sum, n) => sum + n, 0);

  return ((linksRes.data ?? []) as Pick<Link, "id" | "title" | "url" | "platform" | "is_active">[])
    .map((l) => {
      const clicks = clickMap.get(l.id) ?? 0;
      return {
        id: l.id,
        title: l.title,
        subtitle: l.url,
        image_url: null,
        is_active: l.is_active,
        clicks,
        share: totalClicks > 0 ? (clicks / totalClicks) * 100 : 0,
      };
    })
    .sort((a, b) => b.clicks - a.clicks || a.title.localeCompare(b.title, "vi"));
}

/** Danh sách banner kèm lượt bấm. */
export async function getBannerClickRows(
  profileId: string,
  days: AnalyticsRange,
): Promise<ClickAnalyticsRow[]> {
  const supabase = await createClient();
  const [bannersRes, topRes] = await Promise.all([
    supabase
      .from("profile_banners")
      .select("id, name, image_url, url, section, is_active")
      .eq("profile_id", profileId)
      .order("section")
      .order("position")
      .order("created_at"),
    supabase.rpc("get_top_banners", { p_days: days, p_limit: 50 }),
  ]);

  const clickMap = new Map<string, number>();
  for (const row of (topRes.data ?? []) as { id: string; clicks: number | string }[]) {
    clickMap.set(row.id, Number(row.clicks));
  }
  const totalClicks = [...clickMap.values()].reduce((sum, n) => sum + n, 0);

  return ((bannersRes.data ?? []) as Pick<
    ProfileBanner,
    "id" | "name" | "image_url" | "url" | "section" | "is_active"
  >[])
    .map((b) => {
      const clicks = clickMap.get(b.id) ?? 0;
      return {
        id: b.id,
        title: b.name,
        subtitle: b.url,
        image_url: b.image_url,
        is_active: b.is_active,
        clicks,
        share: totalClicks > 0 ? (clicks / totalClicks) * 100 : 0,
      };
    })
    .sort((a, b) => b.clicks - a.clicks || a.title.localeCompare(b.title, "vi"));
}

export async function getLinkClicksSummary(
  profileId: string,
  days: AnalyticsRange,
): Promise<ClickAnalyticsSummary> {
  return buildClickSummary(await getLinkClickRows(profileId, days));
}

export async function getBannerClicksSummary(
  profileId: string,
  days: AnalyticsRange,
): Promise<ClickAnalyticsSummary> {
  return buildClickSummary(await getBannerClickRows(profileId, days));
}

export async function getLinkClickTotal(
  profileId: string,
  linkId: string,
  days: AnalyticsRange,
): Promise<number> {
  const items = await getTopLinks(profileId, days, 100);
  return items.find((item) => item.id === linkId)?.clicks ?? 0;
}

export async function getBannerClickTotal(
  profileId: string,
  bannerId: string,
  days: AnalyticsRange,
): Promise<number> {
  const items = await getTopBanners(profileId, days, 100);
  return items.find((item) => item.id === bannerId)?.clicks ?? 0;
}

export async function getLinkForAnalytics(
  profileId: string,
  linkId: string,
): Promise<Pick<Link, "id" | "title" | "url" | "platform" | "is_active"> | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("links")
    .select("id, title, url, platform, is_active")
    .eq("profile_id", profileId)
    .eq("id", linkId)
    .maybeSingle();
  return data;
}

export async function getBannerForAnalytics(
  profileId: string,
  bannerId: string,
): Promise<Pick<ProfileBanner, "id" | "name" | "image_url" | "url" | "section" | "is_active"> | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profile_banners")
    .select("id, name, image_url, url, section, is_active")
    .eq("profile_id", profileId)
    .eq("id", bannerId)
    .maybeSingle();
  return data;
}

export const getLinkClickSeries = cache(
  async (profileId: string, linkId: string, days: AnalyticsRange): Promise<DailyPoint[]> =>
    fetchItemClickSeries(
      profileId,
      linkId,
      days,
      "get_link_clicks_daily",
      { p_link_id: linkId },
      () => getLinkClickTotal(profileId, linkId, days),
    ),
);

export const getBannerClickSeries = cache(
  async (profileId: string, bannerId: string, days: AnalyticsRange): Promise<DailyPoint[]> =>
    fetchItemClickSeries(
      profileId,
      bannerId,
      days,
      "get_banner_clicks_daily",
      { p_banner_id: bannerId },
      () => getBannerClickTotal(profileId, bannerId, days),
    ),
);
